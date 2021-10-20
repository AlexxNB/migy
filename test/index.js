const SQLite3 = require('./sqlite');

const cmd = process.argv[2];

if(cmd){
    run(cmd);
}else{
    SQLite3.run();
}

function run(name){
    if(cmd == 'sqlite') return SQLite3.run();
}