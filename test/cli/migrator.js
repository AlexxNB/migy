const migy = require('./../../dist/migy');
const sqlite3 = require('sqlite3');
const PARAMS = require('./params');

migy.cli({
    db: new sqlite3.Database(PARAMS.dbname),
    adapter: 'sqlite3',
    dir:PARAMS.migrations_dir
});