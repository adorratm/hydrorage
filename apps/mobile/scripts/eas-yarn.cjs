const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function run(command) {
  return execSync(command, { encoding: 'utf8', shell: true }).trim();
}

try {
  execSync('npm uninstall -g yarn', { stdio: 'inherit' });
} catch {
  console.log('Yarn 1 paketi kaldırılamadı, komut yine de değiştirilecek');
}
execSync('npm install -g @yarnpkg/cli-dist@4.18.0', { stdio: 'inherit' });

const yarnJs = path.join(run('npm root -g'), '@yarnpkg/cli-dist/bin/yarn.js');
if (!fs.existsSync(yarnJs)) {
  console.error('Yarn 4 dosyası yok:', yarnJs);
  process.exit(1);
}

const bundled = execSync(`"${process.execPath}" "${yarnJs}" --version`, {
  encoding: 'utf8',
}).trim();
console.log('bundle', bundled);
if (!bundled.startsWith('4.')) {
  process.exit(1);
}

const shim = `#!/bin/sh\nexec "${process.execPath}" "${yarnJs}" "$@"\n`;
const target = path.join(path.dirname(process.execPath), 'yarn');

function placeShim() {
  if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) {
    fs.unlinkSync(target);
  }
  fs.writeFileSync(target, shim, { mode: 0o755 });
}

try {
  placeShim();
} catch {
  if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) {
    execSync(`sudo rm -f "${target}"`, { stdio: 'inherit', shell: true });
  }
  const tmp = path.join(os.tmpdir(), 'yarn-shim');
  fs.writeFileSync(tmp, shim, { mode: 0o755 });
  execSync(`sudo cp "${tmp}" "${target}" && sudo chmod 755 "${target}"`, {
    stdio: 'inherit',
    shell: true,
  });
}

const version = execSync('yarn --version', { encoding: 'utf8' }).trim();
console.log('yarn now', version, 'via', yarnJs);
if (!version.startsWith('4.')) {
  process.exit(1);
}
