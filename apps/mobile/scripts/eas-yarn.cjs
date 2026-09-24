const { execSync } = require('node:child_process');
const fs = require('node:fs');

execSync('npm install -g yarn@4.18.0', { stdio: 'inherit' });

function run(command) {
  return execSync(command, { encoding: 'utf8', shell: true }).trim();
}

function versionOf(bin) {
  return execSync(`"${bin}" --version`, { encoding: 'utf8' }).trim();
}

const installed = `${run('npm prefix -g')}/bin/yarn`;
let current = run('command -v yarn');
console.log('npm yarn', installed, versionOf(installed));
console.log('path yarn', current, versionOf(current));

if (!versionOf(current).startsWith('4.')) {
  try {
    fs.rmSync(current, { force: true });
    fs.symlinkSync(installed, current);
  } catch {
    execSync(`sudo rm -f "${current}" && sudo ln -sf "${installed}" "${current}"`, {
      stdio: 'inherit',
      shell: true,
    });
  }
  current = run('command -v yarn');
}

const version = versionOf(current);
console.log('yarn now', version);
if (!version.startsWith('4.')) {
  process.exit(1);
}
