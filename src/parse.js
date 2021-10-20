import fs from 'fs/promises';
import path from 'path';
import md5 from 'md5';
import {compress,decompress} from './gzip';

export async function parseSQLMigrations(dir,options){

    const opt = Object.assign({
        separator: /^###/mg,
        downSeparator: /^### DOWN|^### ROLLBACK/mg,
    },options);

    const result = [];

    const list = await fs.readdir(dir);
    for(let file of list){
        const match = file.match(/^(\d+).*\.sql/i);
        if(!match) continue;
        const id = Number(match[1]);

        const filepath = path.join(dir,file);
        const body = await fs.readFile(filepath,'utf8');
        const data = await compress(`/*File:${file}*/\n${body}`)

        const parts = body.replace(/\/\*.+\*\//msg,'')
            .split(opt.downSeparator)
                .map(p => p.split(opt.separator)
                            .map(
                                q => q.replace(/\s+/msg,' ').trim()
                            )
                );

        if(parts.length > 2) throw Error('Syntax error in migration '+file+'. Too many DOWN separators.');
                            
        result.push({
            id,
            up: {
                queries: parts[0],
                md5: md5(parts[0].join(';'))
            },
            down: parts[1] && {
                queries: parts[1]
            },
            data
        });
    }

    return result.sort((mA,mB)=>(mA.id-mB.id));
}

export async function saveMigration(dir,data){
    fs.mkdir(dir,{recursive: true});
    const body = await decompress(data);
    const parts = body.match(/^\/\*File:(.+)\*\/\n([\s\S]+)$/);
    if(!parts) throw Error('Data is invalid');
    fs.writeFile(path.join(dir,parts[1]),parts[2]);
    return parts[1];
}