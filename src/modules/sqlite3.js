/** MySQL DB migration using sqlite3 module */
export default function(options){

    const store = options.store || '_migrations';

    const conn = {
        execute: (query,params)=>new Promise((ok,fail)=>{
            options.db.run(query,params, err =>{
                if(err) return fail(err);
                return ok();
            })
        }),

        query: (query,params)=>new Promise((ok,fail)=>{
            options.db.all(query,params, (err,result) =>{
                if(err) return fail(err);
                return ok(result);
            })
        }),
    }

    return {
        /** execute UP query */
        up: async ({id,queries,md5,data}) => {
            for(let query of queries){
                await conn.execute(query);
            }
            await conn.execute(`INSERT INTO ${store} (id,md5,data) VALUES (?,?,?)`,[id,md5,data]);
        },

        /** execute DOWN query */
        down: async ({id,queries}) => {
            for(let query of queries){
                await conn.execute(query);
            }
            await conn.execute(`DELETE FROM ${store} WHERE id=?`,[id]);
        },

        /** prepare store */
        init: async ()=>{
            await conn.execute(`
                CREATE TABLE IF NOT EXISTS ${store} (
                    id INTEGER PRIMARY KEY,
                    md5 TEXT,
                    data TEXT
                );
           `);
        },

        /** return current list of already applied migrations [{id,md5}]*/
        list: async ()=>{
            try{
                return await conn.query(`
                    SELECT id,md5 FROM ${store};
                `);
            }catch{
                return []
            }
        },

        /** Return migration object by id {id,md5,data} */
        get: async (id) => {
            const result = await conn.query(`
                SELECT * FROM ${store} WHERE id=?;
            `,[id]);
            return result.length ? result[0] : null;
        }
    }
}