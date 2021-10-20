import { gzip, gunzip } from 'zlib';
import { Buffer } from 'buffer';

export function compress(string){
    return new Promise((resolve,reject)=>gzip(string,(err,compressed)=>{
        if(err) return reject(err);
        resolve(Buffer.from(compressed).toString('base64'));
    }));
}

export function decompress(string){
    return new Promise((resolve,reject)=>gunzip(Buffer.from(Buffer.from(string, 'base64')),(err,decompressed)=>{
        if(err) return reject(err);
        resolve(decompressed.toString());
    }));
}