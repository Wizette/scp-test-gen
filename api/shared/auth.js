const crypto = require('crypto');

const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

function createToken(username) {
  const secret = process.env.TOKEN_SECRET;
  const payload = JSON.stringify({ sub: username, exp: Date.now() + TOKEN_EXPIRY });
  const payloadB64 = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return payloadB64 + '.' + sig;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const secret = process.env.TOKEN_SECRET;
  const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  // Timing-safe comparison
  if (Buffer.from(sig).length !== Buffer.from(expected).length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(c => {
    const [key, ...val] = c.trim().split('=');
    if (key) cookies[key.trim()] = val.join('=');
  });
  return cookies;
}

function authCookie(token) {
  return `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
}

function clearAuthCookie() {
  return 'auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

function verifyAdminKey(provided) {
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  const ha = crypto.createHmac('sha256', 'admin-compare').update(String(provided)).digest();
  const hb = crypto.createHmac('sha256', 'admin-compare').update(String(expected)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = { createToken, verifyToken, parseCookies, authCookie, clearAuthCookie, verifyAdminKey };
