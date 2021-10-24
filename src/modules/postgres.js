/** Postgres DB migration using pg,pg-promise modules */
export default function(options){

    const store = options.store || '_migrations';
  
    if(!options.db || !options.db.query) throw Error('Wrong db option.');

    const conn = {
        query: async (query,params)=>(await options.db.query(query,params)).rows,
    }

    return {
        /** execute UP query */
        up: async ({version,queries,md5,data}) => {
            for(let query of queries){
                await conn.query(query);
            }
            await conn.query(`INSERT INTO ${store} (version,md5,data) VALUES ($1,$2,$3)`,[version,md5,data]);
        },

        /** execute DOWN query */
        down: async ({version,queries}) => {
            for(let query of queries){
                await conn.query(query);
            }
            await conn.query(`DELETE FROM ${store} WHERE version=$1`,[version]);
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
            const result = await conn.query(`SELECT * FROM ${store} WHERE version=$1;`,[version]);
            return result.length ? result[0] : null;
        }
    }
}