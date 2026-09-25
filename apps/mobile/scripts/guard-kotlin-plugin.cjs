/**
 * AGP 9 registers the `kotlin` extension itself.
 * A second `apply plugin: kotlin-android` fails with
 * "Cannot add extension with name 'kotlin'".
 */
const fs = require('node:fs');
const path = require('node:path');

const APPLY_RE =
  /^([ \t]*)apply plugin:\s*(['"])(?:kotlin-android|org\.jetbrains\.kotlin\.android)\2\s*$/;

function guardKotlinApply(text) {
  const lines = text.split(/\n/);
  const out = [];
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    const match = line.match(APPLY_RE);
    const prev = [...out].reverse().find((item) => item.trim());
    if (match && !(prev && prev.includes('findByName("kotlin")'))) {
      const indent = match[1];
      out.push(
        `${indent}if (project.extensions.findByName("kotlin") == null) {`,
      );
      out.push(`${indent}  apply plugin: "org.jetbrains.kotlin.android"`);
      out.push(`${indent}}`);
    } else {
      out.push(line);
    }
  }
  return out.join('\n');
}

function walkGradle(dir, acc, depth) {
  if (depth > 8) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'build' || entry.name === '.gradle') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkGradle(full, acc, depth + 1);
    else if (entry.name.endsWith('.gradle')) acc.push(full);
  }
}

function patchTree(root) {
  const files = [];
  walkGradle(root, files, 0);
  let patched = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const hasApply = text.split(/\n/).some((line) => APPLY_RE.test(line.replace(/\r$/, '')));
    if (!hasApply) continue;
    const next = guardKotlinApply(text);
    if (next !== text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')) {
      fs.writeFileSync(file, next);
      patched += 1;
      console.log('guard kotlin plugin:', path.relative(process.cwd(), file));
    }
  }
  return patched;
}

if (require.main === module) {
  const root = path.join(__dirname, '../../..', 'node_modules');
  const count = patchTree(root);
  if (!count) console.log('kotlin-android apply bulunamadı');
}

module.exports = { guardKotlinApply, patchTree };
