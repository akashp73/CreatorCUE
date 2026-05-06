const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerDevice(req, res) {
  const { token, platform = 'android' } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  await prisma.deviceToken.upsert({ where: { token }, update: { user_id: req.user.id, platform }, create: { user_id: req.user.id, token, platform } });
  res.json({ message: 'Device registered' });
}

module.exports = { registerDevice };
