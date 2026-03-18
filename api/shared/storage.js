const { TableClient } = require('@azure/data-tables');

let _table = null;

function getUsersTable() {
  if (!_table) {
    const connStr = process.env.STORAGE_CONNECTION_STRING;
    if (!connStr) throw new Error('STORAGE_CONNECTION_STRING not configured');
    _table = TableClient.fromConnectionString(connStr, 'users');
  }
  return _table;
}

async function ensureTable(table) {
  try {
    await table.createTable();
  } catch (e) {
    if (e.statusCode !== 409) throw e;
  }
}

module.exports = { getUsersTable, ensureTable };
