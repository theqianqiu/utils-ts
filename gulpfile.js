const path = require('path');
const terser = require('@rollup/plugin-terser');
const del = require('del');
const gulp = require('gulp');
const rollup = require('rollup');
const typescript = require('rollup-plugin-typescript2');

const resolvePath = (name) => {
    return path.resolve(__dirname, name);
};
const onwarn = (warning) => {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    console.warn(`(!) ${warning.message}`);
};

const dirBuild = resolvePath('lib');

gulp.task('clean', () => {
    return del([dirBuild], { force: true });
});

const externalDeps = ['react', 'react-dom', 'axios'];
gulp.task('build', async () => {
    const bundle = await rollup.rollup({
        input: resolvePath('./src/index.ts'),
        external: externalDeps,
        plugins: [typescript(), terser()],
        onwarn,
    });

    await bundle.write({
        file: `${dirBuild}/index.js`,
        format: 'esm',
    });
});

gulp.task('default', gulp.series('clean', 'build'));
