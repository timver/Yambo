import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'public/js/yambo.modern.js',
  format: 'iife',
  target: ['es2020'],
  sourcemap: true,
  minify: !isWatch,
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('Build complete!');
}
