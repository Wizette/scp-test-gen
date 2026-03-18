const bcrypt = require('bcryptjs');
const { getUsersTable, ensureTable } = require('../shared/storage');

module.exports = async function (context, req) {
  const { username, password, displayName } = req.body || {};

  if (!username || !password) {
    context.res = { status: 400, body: { error: 'Username and password are required.' } };
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    context.res = { status: 400, body: { error: 'Username must be 3-30 characters (letters, numbers, underscore).' } };
    return;
  }

  if (password.length < 4) {
    context.res = { status: 400, body: { error: 'Password must be at least 4 characters.' } };
    return;
  }

  const table = getUsersTable();
  await ensureTable(table);

  try {
    await table.getEntity('user', username.toLowerCase());
    context.res = { status: 409, body: { error: 'Username already taken.' } };
    return;
  } catch (e) {
    if (e.statusCode !== 404) throw e;
  }

  const hash = await bcrypt.hash(password, 10);

  await table.createEntity({
    partitionKey: 'user',
    rowKey: username.toLowerCase(),
    displayName: displayName || username,
    passwordHash: hash,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  context.res = { status: 201, body: { message: 'Access request submitted. Awaiting admin approval.' } };
};
