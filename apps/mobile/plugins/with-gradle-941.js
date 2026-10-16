const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { guardKotlinApply } = require('../scripts/guard-kotlin-plugin.cjs');

/** Older RN templates hardcode minify off, so Play reports no R8 optimisation. */
function enableReleaseR8(text) {
  let next = text.replace(
    /def enableProguardInReleaseBuilds\s*=\s*false\b/,
    "def enableProguardInReleaseBuilds = (findProperty('android.enableMinifyInReleaseBuilds') ?: true).toBoolean()",
  );
  if (!next.includes('shrinkResources')) {
    next = next.replace(
      /(minifyEnabled\s+enable(?:Proguard|Minify)InReleaseBuilds)/,
      "def enableShrinkResources = findProperty('android.enableShrinkResourcesInReleaseBuilds') ?: 'true'\n            shrinkResources enableShrinkResources.toBoolean()\n            $1",
    );
  }
  return next;
}

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
        const patched = enableReleaseR8(
          guardKotlinApply(fs.readFileSync(appGradle, 'utf8')).replace(
            /getDefaultProguardFile\(\s*(['"])proguard-android\.txt\1\s*\)/g,
            'getDefaultProguardFile("proguard-android-optimize.txt")',
          ),
        );
        fs.writeFileSync(appGradle, patched);
      }

      // AGP 9 + current RN/Expo libs still need these until packages migrate.
      const propsPath = path.join(root, 'gradle.properties');
      if (fs.existsSync(propsPath)) {
        let props = fs.readFileSync(propsPath, 'utf8');
        const ensure = (key, value) => {
          const re = new RegExp(`^${key.replace(/\./g, '\\.')}\\s*=.*$`, 'm');
          if (re.test(props)) {
            props = props.replace(re, `${key}=${value}`);
          } else {
            props = `${props.trimEnd()}\n${key}=${value}\n`;
          }
        };
        ensure('android.builtInKotlin', 'false');
        ensure('android.newDsl', 'false');
        ensure('android.disallowKotlinSourceSets', 'false');
        fs.writeFileSync(propsPath, props);
      }
      return cfg;
    },
  ]);
}

module.exports = withGradle941;
