import fs from 'fs/promises';
import path from 'path';
import md5 from 'md5';
import {compress} from './gzip';

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
        const id = match[1];

        const filepath = path.join(dir,file);
        const body = await fs.readFile(filepath,'utf8');
        const data = await compress(body)

        const parts = body.replace(/\/\*.+\*\//msg,'')
            .split(opt.downSeparator)
                .map(p => p.split(opt.separator)
                            .map(
                                q => q.replace(/\s+/msg,' ').trim()
                            )
                );

        if(parts.length > 2) throw Error('Syntax error in migration '+file+'. Too many DOWN separators.');

        result.push({
            up: {
                id,
                queries: parts[0],
                md5: md5(parts[0])
            },
            down: parts[1] && {
                id,
                queries: parts[1]
            },
            data
        });
    }

    return result;
}