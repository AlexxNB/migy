import sade from 'sade';


export function runCLI(migy){

    const cli = sade(`./migrator.js`);
    cli.version('0.0.1');

    cli
        .command('migrate')
        .describe('Migrate DB to latest version')
        .action( async opts => {
            await migy.migrate();
        })

        .command('rollback <version>')
        .describe('Rollback to specified version.')
        .action( async (version,opts) => {
            await migy.rollback(version);
        })

        .command('restore')
        .describe('Restore migrations files from database')
        .option('-d, --dir', 'Specify dir where files will be saved','restored_migrations')
        .action( async opts => {
            await migy.restore({
                dir: opts.dir
            });
        })
        

    cli.parse(process.argv);
   // process.exit(0);
}