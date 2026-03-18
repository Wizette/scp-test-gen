const bcrypt = require('bcryptjs');
const { getUsersTable } = require('../shared/storage');
const { createToken, authCookie } = require('../shared/auth');

module.exports = async function (context, req) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    context.res = { status: 400, body: { error: 'Username and password are required.' } };
    return;
  }

  const table = getUsersTable();

  let user;
  try {
    user = await table.getEntity('user', username.toLowerCase());
  } catch (e) {
    context.res = { status: 401, body: { error: 'Invalid username or password.' } };
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    context.res = { status: 401, body: { error: 'Invalid username or password.' } };
    return;
  }

  if (user.status !== 'approved') {
    const msg = user.status === 'pending'
      ? 'Your account is pending admin approval.'
      : 'Your account has been rejected.';
    context.res = { status: 403, body: { error: msg } };
    return;
  }

  const token = createToken(username.toLowerCase());

  context.res = {
    status: 200,
    headers: { 'Set-Cookie': authCookie(token) },
    body: { message: 'Login successful.', username: user.rowKey, displayName: user.displayName }
  };
};
