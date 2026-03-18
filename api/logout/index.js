const { clearAuthCookie } = require('../shared/auth');

module.exports = async function (context, req) {
  context.res = {
    status: 200,
    headers: { 'Set-Cookie': clearAuthCookie() },
    body: { message: 'Logged out.' }
  };
};
