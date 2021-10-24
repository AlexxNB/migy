/** SQLite DB migration using sqlite3 module */
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
        up: async ({version,queries,md5,data}) => {
            for(let query of queries){
                await conn.execute(query);
            }
            await conn.execute(`INSERT INTO ${store} (version,md5,data) VALUES (?,?,?)`,[version,md5,data]);
        },

        /** execute DOWN query */
        down: async ({version,queries}) => {
            for(let query of queries){
                await conn.execute(query);
            }
            await conn.execute(`DELETE FROM ${store} WHERE version=?`,[version]);
        },

        /** prepare store */
        init: async ()=>{
            await conn.execute(`
                CREATE TABLE IF NOT EXISTS ${store} (
                    version INTEGER PRIMARY KEY,
                    md5 TEXT,
                    data TEXT
                );
           `);
        },

        /** return current list of already applied migrations [{version,md5}]*/
        list: async ()=>{
            try{
                return await conn.query(`
                    SELECT version,md5 FROM ${store};
                `);
            }catch{
                return []
            }
        },

        /** Return migration object by version {version,md5,data} */
        get: async (version) => {
            const result = await conn.query(`
                SELECT * FROM ${store} WHERE version=?;
            `,[version]);
            return result.length ? result[0] : null;
        }
    }
}