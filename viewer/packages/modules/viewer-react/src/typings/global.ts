/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

declare global {
  var IVJS_URL_PREFIX: string; // eslint-disable-line no-var

  interface Window {
    SZEWTWIN_VIEWER_HOME: string;
  }
}

export {};
