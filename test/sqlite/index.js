const migy = require('./../../dist/migy');
const sqlite3 = require('sqlite3');
const { test,suite } = require('uvu');
const {ok,fixture} = require('uvu/assert');
const utils = require('../utils');

// Params for testing
const PARAMS = {
    dbname: '/tmp/testdb.sqlite',
    migrations_dir: 'test/sqlite/migrations',
    restored_dir: '/tmp/sqlite_restored_migrations',
}

const SQLite3 = suite('SQLite3');

// Setup
SQLite3.before( async ctx => {
    // Init SQLite connection
    ctx.db = new sqlite3.Database(PARAMS.dbname);

    // Promisify methods
    ctx.conn = {
        execute: (query,params)=>new Promise((ok,fail)=>{
            ctx.db.run(query,params, err =>{
                if(err) return fail(err);
                return ok();
            })
        }),

        query: (query,params)=>new Promise((ok,fail)=>{
            ctx.db.all(query,params, (err,result) =>{
                if(err) return fail(err);
                return ok(result);
            })
        }),
    }

    // Init migy
    ctx.migy = await migy.init({
        db: ctx.db,
        adapter: 'sqlite3',
        dir:PARAMS.migrations_dir
    });

    // Read migrations filenames
    ctx.migrations = (await utils.listDir(PARAMS.migrations_dir)).filter(m => m.endsWith('.sql'));
});

//Cleanup
SQLite3.after( async ctx => {
    await ctx.db.close();
    await utils.rmFile(PARAMS.dbname);
    await utils.rmDir(PARAMS.restored_dir)
});


// Tests

SQLite3('Database connection works',async ctx => {
    ok(ctx.conn.query("SELECT 1"),'Test query to DB');
});

SQLite3('Migy initialized', ctx =>{
    ok(!!ctx.migy.migrate,  'Method migrate exists');
    ok(!!ctx.migy.rollback, 'Method rollback exists');
    ok(!!ctx.migy.restore,  'Method restore exists');
})

SQLite3('Migrations list created', ctx =>{
    ok(!!ctx.migrations.length,  'List has items');
})

SQLite3('Migrate to latest', async ctx =>{
    await ctx.migy.migrate();
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].thing == 'pineapple','Seed added');
    ok(row[0].count == 1,'Column created');
})

SQLite3('Rollback', async ctx =>{
    await ctx.migy.rollback(2);
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].count === undefined,'Column is not exists');
})

SQLite3('Migrate to latest', async ctx =>{
    await ctx.migy.migrate();
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].thing == 'pineapple','Seed added');
    ok(row[0].count == 1,'Column created');
})

SQLite3('Restoration', async ctx =>{
    await ctx.migy.restore({
        dir: PARAMS.restored_dir
    });

    const expected = ctx.migrations.map(name => utils.join(PARAMS.migrations_dir,name));
    const actual = ctx.migrations.map(name => utils.join(PARAMS.restored_dir,name));

    for(let i=0; i<expected.length; i++){
        ok(!!actual[i], 'File restored: '+actual[i]);
        fixture( 
            await (await utils.loadFile(actual[i])),
            await utils.loadFile(expected[i]),
            "Content of "+actual[i]+" match "+expected[i]
        )
    }
})

module.exports = SQLite3;