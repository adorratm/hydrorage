/**
 * EAS images ship Yarn 1.22.22. That binary aborts when package.json
 * pins packageManager to Yarn 4, and it is often ahead of Node on PATH.
 * Replace every yarn binary the shell would run.
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function run(command, env = process.env) {
  return execSync(command, { encoding: 'utf8', shell: true, env }).trim();
}

function yarnLocations() {
  try {
    const out = run('which -a yarn 2>/dev/null || true');
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const yarnBefore = yarnLocations();
execSync('npm install -g --force @yarnpkg/cli-dist@4.18.1', { stdio: 'inherit' });

const yarnJs = path.join(run('npm root -g'), '@yarnpkg/cli-dist/bin/yarn.js');
if (!fs.existsSync(yarnJs)) {
  console.error('Yarn 4 dosyası yok:', yarnJs);
  process.exit(1);
}

const bundled = run(`"${process.execPath}" "${yarnJs}" --version`);
console.log('bundle', bundled);
if (!bundled.startsWith('4.')) process.exit(1);

const shim = `#!/bin/sh\nexec "${process.execPath}" "${yarnJs}" "$@"\n`;

function installShim(target) {
  try {
    if (fs.existsSync(target) && fs.readFileSync(target, 'utf8').includes(yarnJs)) return;
  } catch {
    // unreadable or binary; replace it below
  }
  const write = () => {
    if (fs.existsSync(target)) fs.rmSync(target, { force: true });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, shim, { mode: 0o755 });
  };
  try {
    write();
  } catch {
    const tmp = path.join(os.tmpdir(), 'yarn-shim');
    fs.writeFileSync(tmp, shim, { mode: 0o755 });
    execSync(`sudo cp "${tmp}" "${target}" && sudo chmod 755 "${target}"`, {
      stdio: 'inherit',
      shell: true,
    });
  }
  console.log('shim', target);
}

const targets = new Set([
  ...yarnBefore,
  ...yarnLocations(),
  path.join(path.dirname(process.execPath), 'yarn'),
]);
if (targets.size === 0) {
  console.error('yarn binary bulunamadı');
  process.exit(1);
}
for (const target of targets) installShim(target);

const version = run('yarn --version');
console.log('yarn now', version);
if (!version.startsWith('4.')) process.exit(1);
