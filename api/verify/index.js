const { parseCookies, verifyToken } = require('../shared/auth');
const { getUsersTable } = require('../shared/storage');

module.exports = async function (context, req) {
  const cookies = parseCookies(req.headers.cookie);
  const payload = verifyToken(cookies.auth_token);

  if (!payload) {
    context.res = { status: 401, body: { error: 'Not authenticated.' } };
    return;
  }

  const table = getUsersTable();
  try {
    const user = await table.getEntity('user', payload.sub);
    if (user.status !== 'approved') {
      context.res = { status: 403, body: { error: 'Account not approved.' } };
      return;
    }
    context.res = {
      status: 200,
      body: { username: user.rowKey, displayName: user.displayName }
    };
  } catch (e) {
    context.res = { status: 401, body: { error: 'User not found.' } };
  }
};
