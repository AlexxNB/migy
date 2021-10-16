/** MySQL DB migration using mysql2 module */

import mysql from 'mysql2';

export default function(options){

    const opt  = Object.assign({
        host: 'localhost',
        port: 3306,
        user: null,
        password: '',
        database: null,
        store: '_migrations'
    },options);

    if(!opt.user || !opt.database) throw Error('Module not fully configured. Database and user options are required.')

    const conn = mysql.createPool({
        host: opt.host,
        port: opt.port,
        user: opt.user,
        password:opt.password,
        database: opt.database
    }).promise();

    return {
        /** execute UP query */
        up: async ({id,query,md5}) => {
            await conn.execute(query);
            await conn.execute(`INSERT INTO ${opt.store} (id,md5) VALUES (?,?)`,[id,md5]);
        },

        /** execute DOWN query */
        down: async ({id,query}) => {
            await conn.execute(query);
            await conn.execute(`DELETE FROM ${opt.store} WHERE id=?`,[id]);
        },

        /** prepare store */
        init: async ()=>{
            await conn.execute(`
                CREATE TABLE IF NOT EXISTS ${opt.store} (
                    id INT PRIMARY KEY,
                    md5 VARCHAR(32)
                );
           `);
        },

        /** return current list of already applied migrations  {id,md5}*/
        current: async ()=>{
            const [result] = await conn.query(`
                SELECT * FROM ${opt.store};
            `);
            return result;
        }
    }
}