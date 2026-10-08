'use strict';

/**
 * When using the PNPM package manager, you can use pnpmfile to workaround
 * dependencies that have mistakes in their package.json file.
 * (This feature is functionally similar to Yarn's "resolutions".)
 *
 * For details, see the PNPM documentation:
 * https://pnpm.io/pnpmfile#hooks
 *
 * IMPORTANT: After any modification to this file, run "rush update --full"
 * so that PNPM will recalculate all version selections.
 */
module.exports = {
  hooks: {
    readPackage
  }
};

/**
 * The hook is invoked during installation before a package's dependencies
 * are selected. The `packageJson` parameter is the deserialized package.json
 * contents for the package that is about to be installed.
 */
function readPackage(packageJson, context) {
  // @openid/appauth@1.4.0 ships pure-ESM output with extensionless relative
  // imports, which always fails to load under Node/Electron (main process).
  // Pin it back to 1.3.2 until upstream publishes a fixed build.
  if (packageJson.dependencies && packageJson.dependencies['@openid/appauth']) {
    context.log('Pinning @openid/appauth to 1.3.2 for ' + packageJson.name);
    packageJson.dependencies['@openid/appauth'] = '1.3.2';
  }

  return packageJson;
}
