<p align="center">
  <img style="margin: 15px" padding="20" src="https://raw.githubusercontent.com/AlexxNB/migy/master/MigyLogo.svg"/>
</p>

## Why migy?

There are many options to handle migrations of your MySQL, Postgres or SQLite databases, but migy offers cool features to made this procces easier:

- May work as a part of your application or standalone.
- Works with popular node databases modules and can be extended to work with any module you want.
- Migrations stored in *.sql files. You will have full IDE features like syntax highlighting when edit migrations.
- Rollback migrations stored in same file with up migration.
- Supports any count of separate queries in one migration.
- Stores migrations info in migration table, so you can restore migration files from database if needed. Also the hash of every applied migration will be checked, so when you have a different set of migrations files, database migration will be aborted.

## Getting started

### Standalone

Create a file named like `migrator.js` where you want.

```js
const migy = require('migy');

// Import one of supported modules
const mysql = require('mysql2'); 

// Create a connection as described in module's docs
const conn = mysql.createConnection({
            host: 'localhost',  
            user: 'user', 
            password: 'example', 
            database: 'things'
});

migy.cli({
    db: conn, //Connection to db
    adapter: 'mysql', //Specify what module to use
    dir: 'migrations' //Directory where stored migration files
});
```
Now run this file with Node as a common CLI application.

```sh
node migrator.js --help
```

### As a part of your application

Add migy initialization somewhere in your app. Usually in its startup routine. Be sure that you already have existing database connection handeled by one of supported modules.

```js
const migy = require('migy');

...

const migrator = await migy.init({
    db: conn, //Existing connection to db
    adapter: 'postgres', //Specify what module to use
    dir: 'db/migrations' //Directory where stored migration files
});

await migrator.migrate(); // Update database to the latest version

```

## Migrations syntax

Migrations stored in `*.sql` files in specified directory. Every file's name **must starts with digits**, which will be treated as migration version. For example:

```
migrations
  ├─ 1.sql
  ...
  └─ 42.sql
```

Also you can add some text after version or leading zeros:

```
migrations
  ├─ 01-create_table.sql
  ...
  └─ 42_add_seed.sql
```

Each file must content at least one SQL-query which will be run on migration to this version.

```sql
CREATE TABLE things (id INT,thing TEXT);
```

When you need run several queries in one migration separate them with `###` on blank line:

```sql
CREATE TABLE things (id INT,thing TEXT);
###
INSERT INTO things (id,thing) VALUES (1,'apple');
```

Also you can add rollback queries using `### ROLBACK` or `### DOWN` separator on blank line. These queries will be ran in case of lowering database version. 

```sql
CREATE TABLE things (id INT,thing TEXT);
###
INSERT INTO things (id,thing) VALUES (1,'apple');

### DOWN

DROP TABLE things;
```

Finally, you may use comments in your files.

```sql
/* Create a table for things */
CREATE TABLE things (id INT,thing TEXT);

### DOWN

/* Delete table of things */
DROP TABLE things;
```

### API

**`migi.init({db,adapter,dir,store})`**

Initializing the migy instance

- `db`: database established connection
- `adapter`: name of adapter of supported module, or custom adapter function.
- `dir`: directory with migrations files. _Default: migrations_
- `store`: string specified migration store in DB(table name in most cases). *Default: _migrations*

**`migi.cli({db,adapter,dir,store})`**

Run migy as standalone CLI application. Parameters are same as for `migi.init` function.

---

The `migi.init` asynchronus function returns an object with methods:

**`migrate()`**
Run migration process. Checks already applied migration. Validate them with current migrations files. Run queries one by one to reach latest database version.

**`rollback(version)`**
Run rollback process. Checks already applied migration. Validate them with current migrations files. Run rollback queries from migration files to reach specified version of database. In case when some files between versions haven't rollback queries, process will be aborted(without any changes). 
- `version`: integer specifing version to rollback. If you ommit it, all rollback queries will be ran to reach database state before any migrations.

**`restore({dir})`**
Extract all applied migrations from database and save them in specified directory.
- `dir`: the directory where migrations files will be saved. _Default: restored_migrations_

## Custom adapter

There are a couple of builtin adapters for most popular modules like `sqlite3`,`mysql`,`mysql2` and `pg`. But you can create your own adapter for any database module you want.

Adapter is a function which returns object with methods which will be used my migy during migrations.

```js
module.exports = async function(options){
    
    /* 
       - options.db - DB connection object or similar
       - options.store - string specifing store of migrations
    */

    return {
        up: async ({id,queries,md5,data}) => {
            /* 
                id - up migration version
                queries - array of SQL queries
                md5 - hash of migration 
                data - packed migration file (may be long)
            */

           // Run all queries here to migrate DB up
           // Also save id,md5 and data in your store (table)
        },

        
        down: async ({id,queries}) => {
            /* 
                id - down migration version
                queries - array of SQL queries
            */

           // Run all queries here to migrate DB down
           // Also delete entry with id=id from your store (table)
        },

      
        init: async ()=>{
           // Any preparation before migration
           // Create your store(table) here 
        },


        list: async ()=>{
            // return an array of all migration here
            // Note: don't return data here
            // [{id,md5},...]
        },

        /** Return migration object by id {id,md5,data} */
        get: async (id) => {
            /* 
                id - needed migration version
            */
            // return an object of needed migration here
            // {id,md5,data}
        }
    }
}
```

Then you can use it with migy:

```js
const migy = require('migy');
const myAdapter = require('./my_adapter.js');
const anyDB = require('anydb-module');

const conn = anyDB.createConnection(...);

const migrator = await migy.init({
    db: conn,
    adapter: myAdapter
});
```