/**
 * Gradle 9.4.1 ships kotlin-stdlib 2.3.0.
 * Expo SDK 57 gradle plugins compile with Kotlin 2.1.20, which cannot read that metadata.
 * 2.2.x can read metadata up to 2.3.0.
 */
const fs = require('node:fs');
const path = require('node:path');

const PACKAGES = [
  'expo-modules-autolinking',
  'expo-modules-core',
  'expo-updates',
  'expo-dev-launcher',
  'expo-dev-client',
];

const FROM = /kotlin\("jvm"\) version "2\.1\.[^"]+"/g;
const TO = 'kotlin("jvm") version "2.2.20"';

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'build' || entry.name === 'node_modules') continue;
      walk(full, out);
    } else if (entry.name.endsWith('.gradle.kts')) {
      out.push(full);
    }
  }
}

function main() {
  const roots = [path.join(__dirname, '..'), path.join(__dirname, '../../..')];
  let patched = 0;

  for (const name of PACKAGES) {
    let pkgJson;
    try {
      pkgJson = require.resolve(`${name}/package.json`, { paths: roots });
    } catch {
      continue;
    }
    const files = [];
    walk(path.dirname(pkgJson), files);
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (!FROM.test(text)) {
        FROM.lastIndex = 0;
        continue;
      }
      FROM.lastIndex = 0;
      fs.writeFileSync(file, text.replace(FROM, TO));
      patched += 1;
      console.log('kotlin 2.2.20:', path.relative(process.cwd(), file));
    }
  }

  const rnCatalog = path.join(
    path.join(__dirname, '../../..'),
    'node_modules/@react-native/gradle-plugin/gradle/libs.versions.toml',
  );
  if (fs.existsSync(rnCatalog)) {
    const text = fs.readFileSync(rnCatalog, 'utf8');
    const next = text.replace('kotlin = "2.1.20"', 'kotlin = "2.2.20"');
    if (next !== text) {
      fs.writeFileSync(rnCatalog, next);
      patched += 1;
      console.log('kotlin 2.2.20:', path.relative(process.cwd(), rnCatalog));
    }
  }

  if (!patched) {
    console.log('Kotlin 2.1 pin bulunamadı (zaten yamalı veya paket yok)');
  }
}

main();
