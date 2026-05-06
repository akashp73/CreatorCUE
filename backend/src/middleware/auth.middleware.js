require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Verify JWT and attach req.user = { id, name, email, role, institution_id }
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      institution_id: decoded.institution_id,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
};

/**
 * Require specific roles. Usage: requireRole('ADMIN', 'MANAGER')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Access denied. Required roles: ${roles.join(', ')}` });
  }
  next();
};

/**
 * Check X-API-Key header against Institution.api_key in DB
 * Attaches req.institution on success
 */
const apiKeyMiddleware = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing X-API-Key header' });
  try {
    const institution = await prisma.institution.findUnique({ where: { api_key: apiKey } });
    if (!institution || !institution.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }
    req.institution = institution;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireRole, apiKeyMiddleware };
