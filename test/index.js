const SQLite3 = require('./sqlite');
const MySQL = require('./mysql');
const Postgres = require('./postgres');
const CLI = require('./cli');

const cmd = process.argv[2];

if(cmd){
    run(cmd);
}else{
    SQLite3.run();
    MySQL.run();
    Postgres.run();
    CLI.run();
}

function run(name){
    if(cmd == 'sqlite') return SQLite3.run();
    if(cmd == 'mysql') return MySQL.run();
    if(cmd == 'postgres') return Postgres.run();
    if(cmd == 'cli') return CLI.run();
}