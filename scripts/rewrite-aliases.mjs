import fs from 'fs';
import path from 'path';

function rewriteDir(root, aliasRoot, prefix) {
  const files = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.expo' || ent.name === 'dist') continue;
        walk(p);
      } else if (/\.(ts|tsx)$/.test(ent.name)) {
        files.push(p);
      }
    }
  }
  walk(root);

  const importRe = /from\s+['"](\.[^'"]+)['"]/g;
  let changedFiles = 0;

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    let changed = false;
    const next = src.replace(importRe, (m, rel) => {
      const abs = path.normalize(path.join(path.dirname(file), rel));
      let relToAlias = path.relative(aliasRoot, abs).replace(/\\/g, '/');
      if (relToAlias.startsWith('..')) return m;
      relToAlias = relToAlias.replace(/\.(tsx?|jsx?)$/, '');
      changed = true;
      return `from '${prefix}${relToAlias}'`;
    });
    if (changed) {
      fs.writeFileSync(file, next);
      changedFiles++;
      console.log('updated', file);
    }
  }
  console.log(`${root}: ${changedFiles} files`);
}

rewriteDir('apps/api/src', path.resolve('apps/api/src'), '@/');
rewriteDir('apps/mobile', path.resolve('apps/mobile'), '@/');
