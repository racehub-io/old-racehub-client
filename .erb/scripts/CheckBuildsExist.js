// Check if the renderer and main bundles are built
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

const mainPath = path.join(__dirname, '../../src/main.prod.js');
const clientWindowRendererPath = getRendererPath('clientWindow');
const parsingWindowRendererPath = getRendererPath('parsingWindow');

if (!fs.existsSync(mainPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The main process is not built yet. Build it by running "yarn build-main"'
    )
  );
}

if (!fs.existsSync(clientWindowRendererPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The clientWindow renderer process is not built yet. Build it by running "yarn build-renderer"'
    )
  );
}

if (!fs.existsSync(parsingWindowRendererPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The parsingWindow renderer process is not built yet. Build it by running "yarn build-renderer"'
    )
  );
}

function getRendererPath(name: string) {
  return path.join(
    __dirname,
    '..',
    '..',
    'src',
    'dist',
    `${name}.renderer.prod.js`
  );
}
