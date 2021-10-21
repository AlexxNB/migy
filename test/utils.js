const path = require('path');
const fs = require('fs/promises');

exports.isExists = async function(filepath){
    try{
        await fs.access(filepath);
        return true;
    }catch{
        return false;
    }
}

exports.rmFile = async function(filepath){
    await fs.rm(filepath);
}

exports.rmDir = async function(dirpath){
    await fs.rm(dirpath,{ recursive: true })
}

exports.listDir = async function(dirpath){
    return await fs.readdir(dirpath);
}

exports.loadFile = async function(filename){
    return await fs.readFile(filename,'utf8');
}

exports.exitOnThrow = async function(fn){
    try{
        await fn();
    }catch(err){
        console.log(err);
        process.exit(1);
    }
}

exports.join = path.join;