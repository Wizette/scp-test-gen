const { verifyAdminKey } = require('../shared/auth');
const { getUsersTable } = require('../shared/storage');

module.exports = async function (context, req) {
  if (!verifyAdminKey(req.headers['x-admin-key'])) {
    context.res = { status: 403, body: { error: 'Invalid admin key.' } };
    return;
  }

  const { username, action } = req.body || {};
  if (!username || !['approve', 'reject', 'delete'].includes(action)) {
    context.res = { status: 400, body: { error: 'Username and action (approve/reject/delete) required.' } };
    return;
  }

  const table = getUsersTable();
  const key = username.toLowerCase();

  try {
    if (action === 'delete') {
      await table.deleteEntity('user', key);
      context.res = { status: 200, body: { message: `User "${username}" deleted.` } };
    } else {
      const user = await table.getEntity('user', key);
      user.status = action === 'approve' ? 'approved' : 'rejected';
      await table.updateEntity(user, 'Merge');
      context.res = { status: 200, body: { message: `User "${username}" ${user.status}.` } };
    }
  } catch (e) {
    context.res = { status: 404, body: { error: 'User not found.' } };
  }
};
