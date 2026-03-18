const { verifyAdminKey } = require('../shared/auth');
const { getUsersTable, ensureTable } = require('../shared/storage');

module.exports = async function (context, req) {
  if (!verifyAdminKey(req.headers['x-admin-key'])) {
    context.res = { status: 403, body: { error: 'Invalid admin key.' } };
    return;
  }

  const table = getUsersTable();
  await ensureTable(table);

  const users = [];
  const entities = table.listEntities({ queryOptions: { filter: "PartitionKey eq 'user'" } });
  for await (const entity of entities) {
    users.push({
      username: entity.rowKey,
      displayName: entity.displayName,
      status: entity.status,
      createdAt: entity.createdAt
    });
  }

  context.res = { status: 200, body: users };
};
