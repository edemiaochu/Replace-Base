/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import isEqual from "lodash.isequal";

import type { ViewerCommonProps, ViewerInitializerParams } from "../types.js";
import { szewTwinViewerInitializerParamList } from "../types.js";

export { isEqual };

export * from "./MakeCancellable.js";

/**
 * Pull out szewTwin.js initialization options from a set of options
 * @param options
 * @returns
 */
export const getInitializationOptions = (options?: ViewerCommonProps) => {
  const initOptions = {};
  if (options) {
    for (const key of szewTwinViewerInitializerParamList) {
      if ((options as any)[key]) {
        (initOptions as any)[key] = (options as any)[key];
      }
    }
  }
  return initOptions as ViewerInitializerParams;
};
