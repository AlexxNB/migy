export interface Migration {
    version: number,
    md5?: string,
    data?: string,
    queries?: [string]
} 

export interface Adapter {
    init: ()=>Promise<void>,
    list: ()=>Promise<[Migration]>,
    get: (version:number)=>Promise<Migration | null>,
    up: (migration: Migration)=>Promise<void>,
    down: (migration: Migration)=>Promise<void>
}

export type AdapterCreator = (options:MigyConfig)=>Promise<Adaptor>;

export interface MigyConfig {
    /** Existed DB connection coressponding with used adapter */
    db: any,
    /** Adapter to work with provided DB connection */
    adapter: string | AdapterCreator,
    /** Directory where placed migration files */
    dir?: string,
    /** Identificator for migrations store (usually it is table name) */
    store?: string,
}

interface RestoreConfig {
    /** Directory where will be saved migrations files from DB */
    dir?: string
}

interface Migrator {
    /** Run migration to the latest version */
    migrate: ()=>Promise<void>,
    /** Rollback databse to specified version */
    rollback: (version?:number)=>Promise<void>,
    /** Restore migrations files from database */
    restore: (options:RestoreConfig)=>Promise<void>,
}

/** Initialize migration methods */
export function init(MigyConfig): Promise<Migrator>
/** Initialize CLI application */
export function cli(MigyConfig): Promise<void>
