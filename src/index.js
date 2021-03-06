import {isFunc,isStr} from './helpers';
import {parseSQLMigrations,saveMigration} from './parse';
import adapters from './modules';
import { runCLI } from './cli';

export async function init(options){
    const opt = Object.assign({
        db: null,
        adapter: null,
        dir: 'migrations',
        store: '_migrations'
    },options);


    const adapter = await createAdapter(opt);
        
    return {

        /** Run migration to latest version */
        migrate: async ()=>{
            const data = await loadMigrationsData(adapter,opt);

            if(data.applied.length > 0){
                console.log('Validate applied migrations...')
                const result = validate(data);
                if(!result.valid){
                    console.log('(!) Problems found:');
                    result.invalidMigrations.forEach( m => console.log(` - ${m.version}: ${m.error}`));
                    return console.log("Migration aborted!");
                }
            }
        
            const list = getUpMigrations(data);

            if(list.length > 0){
                console.log('Applying migrations...');

                try{
                    await adapter.init();
                }catch(err){
                    console.log(`Migration store preparation fails. Error: ${err}`);
                    return console.log(`Migration aborted!`);
                }

                for(let migration of list){
                    try{
                        await adapter.up(migration);
                        console.log(` - v.${migration.version}: OK`);
                    }catch(err){
                        console.log(` - v.${migration.version}: (!) Fail: ${err.message}`);
                        return console.log(`Migration aborted!`);
                    }
                }
                return console.log(`Migration finished!`);
            }else{
                return console.log("Database is up to date. No migrations needed.");
            }
        },
        /** Downgrade to specified version */
        rollback: async version => {
            version = Number(version);
            const data = await loadMigrationsData(adapter,opt);
      
            if(data.applied.length > 0){
                console.log('Validate applied migrations...')
                const result = validate(data);
                if(!result.valid){
                    console.log('(!) Problems found:');
                    result.invalidMigrations.forEach( m => console.log(` - ${m.version}: ${m.error}`));
                    return console.log("Rollback aborted!");
                }
            }else{
                return console.log(`Database doesn't have any applied migrations. Aborted.`);
            }

            if(version >= data.version) return console.log(`Rollback version must be lower than current DB version!`);

            const list = getDownMigrations(version,data);

            if(!list.length) return console.log("There no any queries for rollback migrations.");
            const targetVersion = list[list.length-1].targetVersion;
            if(targetVersion != version) return console.log(`It is possible to rolback till version ${targetVersion} only.`);

            console.log('Applying rollback migrations...');   
            
            for(let migration of list){
                try{
                    await adapter.down(migration);
                    console.log(` - v.${migration.version}: OK`);
                }catch(err){
                    console.log(` - v.${migration.version}: (!) Fail: ${err.message}`);
                    return console.log(`Rollback aborted!`);
                }
            }
            return console.log(`Rollback finished!`);
        },
        restore: async options =>{
            const params = Object.assign({
                dir: 'restored_migrations',
                version: null,
            },options);

            const data = await loadMigrationsData(adapter,opt);
            if(!data.applied.length) return console.log(`Database doesn't have any applied migrations. Aborted.`);

            console.log('Restoring migrations from database...');
            for(let m of data.applied){
                const migration = await adapter.get(m.version);
                try{
                    const file = await saveMigration(params.dir,migration.data);
                    console.log(` - v.${migration.version}: ${file} - OK`);
                }catch(err){
                    console.log(` - v.${migration.version}: (!) Fail: ${err.message}`);
                }
            }
            return console.log(`Restoration finished!`);
        }
    }
}

export async function cli(options){
    const methods = await init(options);
    runCLI(methods);
}

const adapterMethods = ['init','up','down','list','get'];
/** Create adapter object */
async function createAdapter(options){
    // List of builtin adapters
    const adaptersList = Object.keys(adapters);

    if(!options.adapter || (isStr(options.adapter) && !adaptersList.includes(options.adapter))) throw Error('Wrong adapter! Use one of builtin adapters for modules from this list: '+adaptersList.join(', '));
    const adapterFunc = (isStr(options.adapter)) ? adapters[options.adapter] : options.adapter;

    // Check that given adapter is a function
    if(!isFunc(adapterFunc)) throw Error('Adapter is invalid');

    const adapter = await adapterFunc(options);

    // Check that adapter has all needed methods
    for(let method of adapterMethods){
        if(!isFunc(adapter[method])) throw Error('Adapter is invalid. Missed method: ' + method);
    }

    return adapter;
}

/** Get current migrations data */
async function loadMigrationsData(adapter,options){
   //load local migrations list
   const local = await parseSQLMigrations(options.dir);

   //load applied migrations
   const applied = await adapter.list();
   
   //current DB version
   const version = applied.reduce((prev,cur)=>prev>cur.version?prev:cur.version,0);

   return {
       local,
       applied,
       version
   }
}


/** Validate applied migrations */
function validate(data){
        const result = {
            valid: true,
            invalidMigrations:[]
        }

        for(let migration of data.applied){

            let error = null;
            const localMigration = data.local.find(m => m.version == migration.version);

            if(localMigration){
                if(localMigration.up.md5 != migration.md5) error = "Hash code mismatch";
            }else{
                error = 'Migration is not exist in local set'
            }

            if(error) {
                result.valid = false;
                result.invalidMigrations.push({version:migration.version,error});
            }
        }

        return result;
}

function getUpMigrations(data){
    return data.local.filter(m => m.version > data.version).map(m => ({
        version:m.version,
        md5:m.up.md5,
        queries:m.up.queries,
        data:m.data,
    }));
}

function getDownMigrations(version,data){
    const result = [];

    for(let i = data.local.length-1; i >= 0; i--){
        const m = data.local[i];
        const prev = data.local[i-1];
        if(m.version <= version || !m.down) break;
        result.push({
            version:m.version,
            queries: m.down.queries,
            targetVersion: (prev && prev.version) || 0
        })
    }
    return result;
}