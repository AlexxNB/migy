const { build } = require('esbuild');
const pkg = require('./package.json');

const DEV = process.argv.includes('--dev');

// Node-module
build({
    entryPoints: ['./src/index.js'],
    format: "cjs",
    outfile: pkg.main,
    minify: !DEV,
    platform: 'node',
    sourcemap: DEV && 'inline',
    bundle: true,
});

// ES-module
build({
    entryPoints: ['./src/index.js'],
    format: "esm",
    outfile: pkg.module,
    platform: 'node',
    minify: !DEV,
    sourcemap: DEV && 'inline',
    bundle: true,
});