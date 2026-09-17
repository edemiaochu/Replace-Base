/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

export const appInfo = {
  id: "szewtwin-viewer",
  title: "szewTwin Viewer for Desktop",
  envPrefix: "SZEWTWIN_VIEWER_",
};

export const getAppEnvVar = (varName: string): string | undefined =>
  process.env[`${appInfo.envPrefix}${varName}`];
