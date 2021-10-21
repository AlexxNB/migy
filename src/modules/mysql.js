/** MySQL DB migration using mysql2 module */
export default function(options){

    const store = options.store || '_migrations';

    if(!options.db || !options.db.query) throw Error('Wrong db option.');

    const conn = (options.db.constructor.name  == 'PromiseConnection') 
    ?   {
            query: async (query,params)=>(await options.db.query(query,params))[0],
        } 
    :   {
            query: (query,params)=>new Promise((ok,fail)=>{
                options.db.query(query,params, (err,result,fields) =>{
                    if(err) return fail(err);
                    return ok(result);
                })
            }),
        }

    return {
        /** execute UP query */
        up: async ({id,queries,md5,data}) => {
            for(let query of queries){
                await conn.query(query);
            }
            await conn.query(`INSERT INTO ${store} (id,md5,data) VALUES (?,?,?)`,[id,md5,data]);
        },

        /** execute DOWN query */
        down: async ({id,queries}) => {
            for(let query of queries){
                await conn.query(query);
            }
            await conn.query(`DELETE FROM ${store} WHERE id=?`,[id]);
        },

        /** prepare store */
        init: async ()=>{
            await conn.query(`
                CREATE TABLE IF NOT EXISTS ${store} (
                    id int,
                    md5 varchar(32),
                    data TEXT,
                    PRIMARY KEY(id)
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