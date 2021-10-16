import {isFunc,isStr} from './helpers';
import {parseSQLMigrations} from './parse';
import adapters from './modules';

const methods = ['init','up','down','list','get'];

export async function init(options){
    const opt = Object.assign({
        db: null,
        adapter: null,
        dir: 'migrations',
        store: '_migrations'
    },options);

    const adaptersList = Object.keys(adapters);

    if(!opt.adapter || (isStr(opt.adapter) && !adaptersList.includes(opt.adapter))) throw Error('Wrong adapter! Use one of builtin adapters for modules from this list: '+adaptersList.join(', '));
    const adapterFunc = (isStr(opt.adapter)) ? adapters[opt.adapter] : opt.adapter;

    // Check that given adapter is a function
    if(!isFunc(adapterFunc)) throw Error('Adapter is invalid');

    const adapter = await adapterFunc(opt);

    // Check that adapter has all needed methods
    for(let method of methods){
        if(!isFunc(adapter[method])) throw Error('Adapter is invalid. Missed method: ' + method);
    }

    //load local migrations list
    const localMigrations = await parseSQLMigrations(opt.dir);

    





   // if(!module) console.log('Wrong module option');

  //  await opt.module.init();
    
    console.log(JSON.stringify(localMigrations,null,'  '));
/*
    const getState = async () => {
        const dbstatus = await opt.module.current();

        const available = (migrations.length && migrations[migrations.length-1].up.id) || null;
        const current = (dbstatus.length && dbstatus[migrations.length-1].id) || null;
        const diff = migrations.filter( m => !dbstatus.find(d => d.id == m.id));
        const validation = dbstatus.map( d => {
            const  mig = migrations.find(m => m.id == d.id);
            return {
                id:d.id,
                pass: mig && mig.md5 == d.md5 || false
            }
        });

        return {
            available,
            current,
            diff,
            validation,
            actual: available == current,
            valid: !validation.find(v => !v.pass)
        }
    }


    return {
        run: async () => {
            console.log('Check database current state...')
            const state = await getState();
            console.log(` - ${state.actual 
                ? 'is actual.'
                : 'Database\'s curent version is ' 
                    + (state.current || 'N/A') 
                    + (state.available 
                        ? '; Will be updated to version '+state.available+'.'
                        : '.')
            }`);

            console.log(` - Database\'s state ${ valid ? 'matches': 'doesn\'t match'} local migrations set.`);

            if(!valid) console.log('Migration aborted due mismatch between database\'s applied migration and local migrations set.');
            
        },
        state: getState
    }*/
}