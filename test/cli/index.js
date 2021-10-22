const {execSync} = require('child_process');
const sqlite3 = require('sqlite3');
const { suite } = require('uvu');
const {ok,match,fixture} = require('uvu/assert');
const utils = require('../utils');
const PARAMS = require('./params');

const CLI = suite('CLI');

// Setup
CLI.before( async ctx => {
    // Init SQLite connection
    const db = new sqlite3.Database(PARAMS.dbname);
    ctx.conn = {
        query: (query,params)=>new Promise((ok,fail)=>{
            db.all(query,params, (err,result) =>{
                if(err) return fail(err);
                return ok(result);
            })
        }),
        close: ()=>db.close()
    }

    ctx.cli = function(command){
        return execSync('node test/cli/migrator '+command).toString()
    }

    // Read migrations filenames
    ctx.migrations = (await utils.listDir(PARAMS.migrations_dir)).filter(m => m.endsWith('.sql'));
});

// Cleanup
CLI.after( async ctx => {
    await ctx.conn.close();
    await utils.rmFile(PARAMS.dbname);
});

// Tests
CLI('CLI is working', ctx => {
    const result = ctx.cli('--help');
    match(result,'Available Commands')
});

CLI('Database connection works',async ctx => {
    ok(ctx.conn.query("SELECT 1"),'Test query to DB');
});

CLI('Migrations list created', ctx =>{
    ok(!!ctx.migrations.length,  'List has items');
})

CLI('Migrate to latest', async ctx =>{
    ctx.cli('migrate');
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].thing == 'pineapple','Seed added');
    ok(row[0].count == 1,'Column created');
})

CLI('Rollback', async ctx =>{
    ctx.cli('rollback 2');
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].count === undefined,'Column is not exists');
    ok(row[0].thing == 'pineapple','Seed still exists');
})

CLI('Migrate to latest', async ctx =>{
    ctx.cli('migrate');
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].thing == 'pineapple','Seed added');
    ok(row[0].count == 1,'Column created');
})

CLI('Restoration', async ctx =>{
    ctx.cli('restore -d '+PARAMS.restored_dir);

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

module.exports = CLI;

