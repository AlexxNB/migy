const migy = require('./../dist/migy');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('test/testdb.sqlite');

migy.init({
    db,
    adapter: 'sqlite3',
    dir:'test/migrations'
}).then( async ({migrate,rollback,restore}) => {
    // await migrate();
   // await rollback(1);
   await restore({
       dir: 'test/restored_migrations'
   });
});