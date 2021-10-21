const migy = require('./../../dist/migy');
const mysql = require('mysql2/promise');
const { test,suite } = require('uvu');
const {ok,fixture} = require('uvu/assert');
const utils = require('../utils');
const waitPort = require('wait-port');

// Params for testing
const PARAMS = {
    host: 'mysql',
    port: 3306,
    user: 'test',
    password: 'test',
    database: 'test',
    migrations_dir: 'test/mysql/migrations',
    restored_dir: '/tmp/restored_migrations',
}

const MySQL = suite('MySQL');

// Setup
MySQL.before( async ctx => {
    try{
        // Wait when DB will be available
        await waitPort({
            host: PARAMS.host, 
            port: PARAMS.port
        })

        // Open DB connection
        const conn = await mysql.createConnection({
            host: PARAMS.host, 
            port: PARAMS.port, 
            user: PARAMS.user, 
            password: PARAMS.password, 
            database: PARAMS.database
        });

        ctx.conn = {
            query: async (query,params)=>(await conn.query(query,params))[0],
            end: async ()=>conn.end()
        }

        // Init migy
        ctx.migy = await migy.init({
            db: conn,
            adapter: 'mysql',
            dir:PARAMS.migrations_dir
        });
        

        // Read migrations filenames
        ctx.migrations = (await utils.listDir(PARAMS.migrations_dir)).filter(m => m.endsWith('.sql'));
    }catch(err){
        console.log(err);
        process.exit(1);
    }
});

//Cleanup
MySQL.after( async ctx => {
    ctx.conn.end();
   // await utils.rmDir(PARAMS.restored_dir)
});


// Tests

MySQL('Database created',async ctx => {
    ok(ctx.conn.query("SELECT 1"),'Test query to DB');
});

MySQL('Migy initialized', ctx =>{
    ok(!!ctx.migy.migrate,  'Method migrate exists');
    ok(!!ctx.migy.rollback, 'Method rollback exists');
    ok(!!ctx.migy.restore,  'Method restore exists');
})

MySQL('Migrations list created', ctx =>{
    ok(!!ctx.migrations.length,  'List has items');
})

MySQL('Migrate to latest', async ctx =>{
    await ctx.migy.migrate();
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].thing == 'pineapple','Seed added');
    ok(row[0].count == 1,'Column created');
})

MySQL('Rollback', async ctx =>{
    await ctx.migy.rollback(2);
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].count === undefined,'Column is not exists');
})

MySQL('Migrate to latest', async ctx =>{
    await ctx.migy.migrate();
    const row = await ctx.conn.query("SELECT * FROM things");
    ok(row[0].thing == 'pineapple','Seed added');
    ok(row[0].count == 1,'Column created');
})

MySQL('Restoration', async ctx =>{
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

module.exports = MySQL;