require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * Login handler for super admin.
 * POST /api/super-admin/login
 */
const loginSuperAdmin = (req, res) => {
  const { email, password } = req.body;
  if (
    email !== process.env.SUPER_ADMIN_EMAIL ||
    password !== process.env.SUPER_ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid super admin credentials' });
  }
  const token = jwt.sign(
    { role: 'SUPER_ADMIN', email },
    process.env.SUPER_ADMIN_JWT_SECRET,
    { expiresIn: '2h' }
  );
  res.json({ token });
};

/**
 * Middleware to protect super admin routes.
 */
const requireSuperAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);
    if (decoded.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Not a super admin' });
    }
    req.superAdmin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Super admin token invalid or expired' });
  }
};

module.exports = { loginSuperAdmin, requireSuperAdmin };
