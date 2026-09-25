const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/** AGP on SDK 57 / compileSdk 37 requires Gradle >= 9.4.1; Expo template still ships 9.3.1. */
function withGradle941(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const file = path.join(
        cfg.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties',
      );
      const next = fs
        .readFileSync(file, 'utf8')
        .replace(
          /distributionUrl=.*/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-9.4.1-bin.zip',
        );
      fs.writeFileSync(file, next);
      return cfg;
    },
  ]);
}

module.exports = withGradle941;
