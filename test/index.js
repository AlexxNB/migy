const migy = require('./../dist/migy');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('test/testdb.sqlite');

migy.init({
    db,
    adapter: 'sqlite3',
    dir:'test/migrations'
}).then( async ({status}) => {
    console.log(await status());
});