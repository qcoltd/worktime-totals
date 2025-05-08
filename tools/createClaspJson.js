const fs = require("fs");

const env = process.argv[2];
if (env !== undefined) {
  console.log(`env "${env}" is set. using .env.${env}`);
}

// scripts内のディレクトリ名をリストで取得
const root = './scripts';
const scriptsDirNames = fs.readdirSync(root)

// 各scriptsのディレクトリ内の.envを参照して.clasp.jsonを作成する
scriptsDirNames.forEach((dirName) => {
  const envFile = env !== undefined ? `${root}/${dirName}/.env.${env}` : `${root}/${dirName}/.env`

  if (!fs.existsSync(envFile)) {
    console.error(`\nenv file is not found. aborting`);
    process.exit(1);
  }

  // 各clasp.jsonファイルの内容が各envを参照できていなかった。process.envの既にある変数を上書きできない事が原因。
  // そのため、override: trueで上書きできるように設定した。
  // Reference: https://stackoverflow.com/questions/65407397/dotenv-unable-to-overwrite-key-value-pair
  require("dotenv").config({ path: envFile, override: true });
  
  const claspJsonPath = `${root}/${dirName}/.clasp.json`;
  
  const jsonData = {
    scriptId: process.env.SCRIPT_ID,
    rootDir: `${root}/${dirName}/dist`,
    parentId: [process.env.SPREADSHEET_ID],
  };
  
  function writeFile(path, data) {
    const jsonStr = JSON.stringify(data);
    fs.writeFile(path, jsonStr, (err) => {
      if (err) rej(err);
      if (!err) {
        console.log(data);
      }
    });
  }
  
  function isExistingFile(file) {
    try {
      fs.statSync(file);
      return true;
    } catch (err) {
      return false;
    }
  }
  
  function main(path, input) {
    const stats = isExistingFile(path);
    if (stats) {
      fs.unlinkSync(path);
    }
    writeFile(path, input);
  }
  
  main(claspJsonPath, jsonData);
})
