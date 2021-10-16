/** MySQL DB migration using sqlite3 module */

import sqlite3 from 'sqlite3';

export default function(options){

    const opt  = Object.assign({
        database: ':memory:',
        store: '_migrations'
    },options);

    const openDB = async () => {
        const db = await Promise((ok,fail) => {
            const conn = new sqlite3.Database(opt.database,err => {
                if(err) return fail(err);
                ok(conn);
            });
        });

        return {
            close: db.close,
            execute: (query,params)=>Promise((ok,fail)=>{
                db.run(query,params, err =>{
                    if(err) return fail(err);
                    return ok();
                })
            }),
            query: (query,params)=>Promise((ok,fail)=>{
                db.all(query,params, (err,result) =>{
                    if(err) return fail(err);
                    return ok(result);
                })
            }),
        }
    }


    /**
     * Migration object:
     * {
     *    id: integer,       // Migration ID
     *    md5: string,       // md5 of all UP queries
     *    queries: [string]  // Up queries array
     *    data: string       // Data to restore migration from DB
     * }
     */

    return {
        /** execute UP query */
        up: async ({id,queries,md5,data}) => {
            const conn = await openDB();
            for(let query of queries){
                await conn.execute(query);
            }
            await conn.execute(`INSERT INTO ${opt.store} (id,md5,data) VALUES (?,?)`,[id,md5,data]);
            conn.close();
        },

        /** execute DOWN query */
        down: async ({id,queries}) => {
            const conn = await openDB();
            for(let query of queries){
                await conn.execute(query);
            }
            await conn.execute(`DELETE FROM ${opt.store} WHERE id=?`,[id]);
            conn.close();
        },

        /** prepare store */
        init: async ()=>{
            await conn.execute(`
                CREATE TABLE IF NOT EXISTS ${opt.store} (
                    id INT PRIMARY KEY,
                    md5 VARCHAR(32)
                );
           `);
           conn.close();
        },

        /** return current list of already applied migrations  [{id,md5}]*/
        list: async ()=>{
            const conn = await openDB();
            const result = await conn.query(`
                SELECT id,md5 FROM ${opt.store};
            `);
            conn.close();
            return result;
        },

        /** Return migration object by id {id,md5,data} */
        migration: async (id) => {
            const conn = await openDB();
            const result = await conn.query(`
                SELECT * FROM ${opt.store} WHERE id=?;
            `,[id]);
            conn.close();
            return result.length ? result[0] : null;
        }
    }
}