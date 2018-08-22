const path = require('path');
const shell = require('shelljs');

const rootDir = path.join(__dirname, '..');

shell.cp('-R', path.join(rootDir, 'src', 'public'),
  path.join(rootDir, 'dist', 'public'));
