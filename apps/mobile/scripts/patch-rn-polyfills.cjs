/**
 * RN 0.87 removed react-native/rn-get-polyfills.js.
 * Expo SDK 57 Metro still requires that path and calls it as a function.
 */
const fs = require('node:fs');
const path = require('node:path');

const body = `'use strict';
module.exports = require('@react-native/js-polyfills');
`;

function main() {
  let rnPkg;
  try {
    rnPkg = require.resolve('react-native/package.json', {
      paths: [path.join(__dirname, '..'), path.join(__dirname, '../../..')],
    });
  } catch {
    console.log('react-native yok, rn-get-polyfills yaması atlandı');
    return;
  }

  const dest = path.join(path.dirname(rnPkg), 'rn-get-polyfills.js');
  fs.writeFileSync(dest, body);
  console.log('rn-get-polyfills.js:', dest);
}

main();
