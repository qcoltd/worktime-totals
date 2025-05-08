import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import { readdirSync } from 'fs';

// appsディレクトリ内のサブディレクトリごとにmain.tsをエントリーファイルとして設定
const root = resolve(__dirname, 'scripts');
const entryPoints = readdirSync(root).reduce((entries, dir) => {
  const fullDirPath = resolve(root, dir);
  const entryFile = resolve(fullDirPath, 'src/main.ts');
  entries[dir] = entryFile;
  return entries;
}, {});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    build: {
      env,
      minify: false, // trueにすると関数名が消えるのでfalse必須
      lib: {
      entry: entryPoints,
      name: 'main',
      formats: ['cjs'],
    },
    rollupOptions: {
      output: {
        dir: root,
        entryFileNames: '[name]/dist/main.js', // [name] -> root内のディレクトリ名
      },
      treeshake: false
    },
    emptyOutDir: false, // 出力先のクリアを無効化 (各ディレクトリ内に個別で出力するため)
  },
  resolve: {
    alias: [{
      find: "@",
      replacement: ""
    }]
    },
  };
});
