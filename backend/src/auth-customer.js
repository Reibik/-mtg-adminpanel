const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-jwt-secret';
const JWT_ACCESS_TTL = '15m';
const JWT_REFRESH_DAYS = 30;

// ── Password hashing ─────────────────────────────────────
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ── JWT helpers ───────────────────────────────────────────
function signAccessToken(customer) {
  return jwt.sign(
    { sub: customer.id, email: customer.email, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_TTL }
  );
}

function signRefreshToken(customer) {
  const expiresAt = new Date(Date.now() + JWT_REFRESH_DAYS * 86400000);
  const token = jwt.sign(
    { sub: customer.id, type: 'refresh', jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: `${JWT_REFRESH_DAYS}d` }
  );
  // Store hash of refresh token in DB
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  db.prepare(
    'INSERT INTO sessions (customer_id, refresh_token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(customer.id, hash, expiresAt.toISOString());
  return { token, expiresAt };
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'refresh') return null;
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const session = db.prepare(
      'SELECT * FROM sessions WHERE refresh_token_hash = ? AND expires_at > datetime(?)'
    ).get(hash, new Date().toISOString());
    if (!session) return null;
    return { payload, session };
  } catch {
    return null;
  }
}

function revokeRefreshToken(token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  db.prepare('DELETE FROM sessions WHERE refresh_token_hash = ?').run(hash);
}

// ── Email verification token ──────────────────────────────
function generateEmailToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ── Express middleware ─────────────────────────────────────
function authCustomer(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  const payload = verifyAccessToken(header.slice(7));
  if (!payload) {
    return res.status(401).json({ error: 'Токен истёк или невалиден' });
  }
  const customer = db.prepare('SELECT * FROM customers WHERE id = ? AND status = ?').get(payload.sub, 'active');
  if (!customer) {
    return res.status(401).json({ error: 'Аккаунт не найден или заблокирован' });
  }
  req.customer = customer;
  next();
}

// ── Telegram auth verification ────────────────────────────
function verifyTelegramAuth(data) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  const { hash, ...rest } = data;
  if (!hash) return false;

  // Check auth_date is not too old (1 day)
  if (rest.auth_date && (Date.now() / 1000 - Number(rest.auth_date)) > 86400) {
    return false;
  }

  const secret = crypto.createHash('sha256').update(botToken).digest();
  const checkString = Object.keys(rest)
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n');
  const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
  return hmac === hash;
}

// ── Cleanup expired sessions ──────────────────────────────
function cleanExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}
setInterval(cleanExpiredSessions, 3600000); // every hour

module.exports = {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  generateEmailToken,
  authCustomer,
  verifyTelegramAuth,
};
