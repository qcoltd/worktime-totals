/**
 * @see {@link https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/826}
 *
 * NOTE:
 * vite/client.dで以下の型を用いているが、vite自体は定義しておらず、他定義から持ってくる必要がある。
 * （esbuildのd.tsで解決されそうだが、参照されないのが問題なのかも）
 * 手軽な方法として、tsconfigのlibに`dom`を追加すると、そちらから参照を解決できるが、
 * その場合、google-app-scriptsで定義されているMimeTypeが競合する。
 */

declare namespace WebAssembly {
  type Imports = {};
  type Instance = {};
}

type Worker = {};

type SharedWorker = {};

type WebSocket = {};
