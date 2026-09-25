const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { guardKotlinApply } = require('../scripts/guard-kotlin-plugin.cjs');

/** AGP on RN 0.87 requires Gradle >= 9.4.1; Expo template still ships 9.3.1. */
function withGradle941(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const root = cfg.modRequest.platformProjectRoot;
      const wrapper = path.join(root, 'gradle/wrapper/gradle-wrapper.properties');
      const wrapped = fs
        .readFileSync(wrapper, 'utf8')
        .replace(
          /distributionUrl=.*/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip',
        );
      fs.writeFileSync(wrapper, wrapped);

      const appGradle = path.join(root, 'app/build.gradle');
      if (fs.existsSync(appGradle)) {
        const patched = guardKotlinApply(fs.readFileSync(appGradle, 'utf8')).replace(
          /getDefaultProguardFile\(\s*(['"])proguard-android\.txt\1\s*\)/g,
          'getDefaultProguardFile("proguard-android-optimize.txt")',
        );
        fs.writeFileSync(appGradle, patched);
      }
      return cfg;
    },
  ]);
}

module.exports = withGradle941;
