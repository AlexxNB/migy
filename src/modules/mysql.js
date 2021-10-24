/** MySQL DB migration using mysql2 module */
export default function(options){

    const store = options.store || '_migrations';

    if(!options.db || !options.db.query) throw Error('Wrong db option.');

    const conn = universalConnection(options.db);

    return {
        /** execute UP query */
        up: async ({version,queries,md5,data}) => {
            for(let query of queries){
                await conn.query(query);
            }
            await conn.query(`INSERT INTO ${store} (version,md5,data) VALUES (?,?,?)`,[version,md5,data]);
        },

        /** execute DOWN query */
        down: async ({version,queries}) => {
            for(let query of queries){
                await conn.query(query);
            }
            await conn.query(`DELETE FROM ${store} WHERE version=?`,[version]);
        },

        /** prepare store */
        init: async ()=>{
            await conn.query(`
                CREATE TABLE IF NOT EXISTS ${store} (
                    version int,
                    md5 varchar(32),
                    data TEXT,
                    PRIMARY KEY(version)
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

function universalConnection(conn){
    // Mysql2 Promise Connection
    if(conn.constructor.name  == 'PromiseConnection') return {
        query: async (query,params)=>(await conn.query(query,params))[0],
    }

    // Common connection with callback
    return {
        query: (query,params)=>new Promise((ok,fail)=>{
            conn.query(query,params, (err,result) =>{
                if(err) return fail(err);
                return ok(result);
            })
        }),
    }
}