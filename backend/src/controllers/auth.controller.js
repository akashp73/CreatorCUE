const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      institution_id: user.institution_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, password, institution_id } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    // Find user — by email+institution if provided, or just by email (first match)
    const user = institution_id
      ? await prisma.user.findUnique({ where: { institution_id_email: { institution_id, email: email.toLowerCase() } } })
      : await prisma.user.findFirst({ where: { email: email.toLowerCase(), is_active: true }, include: { institution: { select: { id: true, name: true, subdomain: true, logo_url: true } } } });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials or account inactive' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshTokenValue = uuidv4();
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshTokenValue,
        expires_at: refreshExpiry,
      },
    });

    // Update usage metric
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await prisma.usageMetric.upsert({
      where: { institution_id_month: { institution_id: user.institution_id, month } },
      update: { users_active: { increment: 0 } },
      create: { institution_id: user.institution_id, month, leads_created: 0, campaigns_sent: 0, users_active: 1 },
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshTokenValue,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution_id: user.institution_id,
        institution: user.institution || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

    const stored = await prisma.refreshToken.findUnique({ where: { token: refresh_token } });
    if (!stored || stored.expires_at < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.user_id } });
    if (!user || !user.is_active) return res.status(401).json({ error: 'User not found or inactive' });

    // Rotate: delete old, create new
    await prisma.refreshToken.delete({ where: { token: refresh_token } });
    const newRefreshToken = uuidv4();
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = generateAccessToken(user);
    res.json({ access_token: accessToken, refresh_token: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) {
      await prisma.refreshToken.deleteMany({ where: { token: refresh_token } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        institution_id: true, is_active: true, created_at: true,
        institution: { select: { name: true, subdomain: true, logo_url: true, primary_color: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, institution_id } = req.body;
    if (!name || !email || !password || !institution_id) {
      return res.status(400).json({ error: 'name, email, password, institution_id are required' });
    }

    const existing = await prisma.user.findUnique({
      where: { institution_id_email: { institution_id, email } },
    });
    if (existing) return res.status(409).json({ error: 'User with this email already exists' });

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name, email, password_hash,
        role: role || 'COUNSELLOR',
        institution_id,
      },
    });

    res.status(201).json({
      id: user.id, name: user.name, email: user.email,
      role: user.role, institution_id: user.institution_id,
    });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password and new_password required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password_hash } });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refreshToken, logout, getMe, register, changePassword };
