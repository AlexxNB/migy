const migy = require('./../../dist/migy');
const pgp = require('pg-promise')();
const { Client } = require('pg')
const { test,suite } = require('uvu');
const {ok,fixture} = require('uvu/assert');
const utils = require('../utils');
const waitPort = require('wait-port');

// Params for testing
const PARAMS = {
    host: 'postgres',
    port: 5432,
    user: 'test',
    password: 'test',
    database: 'test',
    migrations_dir: 'test/postgres/migrations',
    restored_dir: '/tmp/postgres_restored_migrations',
}

const Postgres = suite('Postgres');

// Setup
Postgres.before( async ctx => {
    try{
        // Wait when DB will be available
        await waitPort({
            host: PARAMS.host, 
            port: PARAMS.port
        })

        // Open DB connection
        /*
        ctx.conn = await pgp({
            host: PARAMS.host, 
            port: PARAMS.port, 
            user: PARAMS.user, 
            password: PARAMS.password, 
            database: PARAMS.database
        });*/
        
        ctx.conn = new Client({
            host: PARAMS.host, 
            port: PARAMS.port, 
            user: PARAMS.user, 
            password: PARAMS.password, 
            database: PARAMS.database
        });
        ctx.conn.connect();

        

        // Init migy
        ctx.migy = await migy.init({
            db: ctx.conn,
            adapter: 'pg',
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
Postgres.after( async ctx => {
   // pgp.end();
   ctx.conn.end();
   // await utils.rmDir(PARAMS.restored_dir)
});


// Tests

Postgres('Database connected',async ctx => {
    ok(ctx.conn.query("SELECT 1"),'Test query to DB');
});

Postgres('Migy initialized', ctx =>{
    ok(!!ctx.migy.migrate,  'Method migrate exists');
    ok(!!ctx.migy.rollback, 'Method rollback exists');
    ok(!!ctx.migy.restore,  'Method restore exists');
})

Postgres('Migrations list created', ctx =>{
    ok(!!ctx.migrations.length,  'List has items');
})

Postgres('Migrate to latest', async ctx =>{
    await ctx.migy.migrate();
    const {rows} = await ctx.conn.query("SELECT * FROM things");
    ok(rows[0].thing == 'pineapple','Seed added');
    ok(rows[0].count == 1,'Column created');
})

Postgres('Rollback', async ctx =>{
    await ctx.migy.rollback(2);
    const {rows} = await ctx.conn.query("SELECT * FROM things");
    ok(rows[0].count === undefined,'Column is not exists');
})

Postgres('Migrate to latest', async ctx =>{
    await ctx.migy.migrate();
    const {rows} = await ctx.conn.query("SELECT * FROM things");
    ok(rows[0].thing == 'pineapple','Seed added');
    ok(rows[0].count == 1,'Column created');
})

Postgres('Restoration', async ctx =>{
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

module.exports = Postgres;