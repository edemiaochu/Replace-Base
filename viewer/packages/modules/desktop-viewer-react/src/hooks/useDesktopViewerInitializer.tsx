/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { ViewerInitializerParams } from "@szewtwin/viewer-react";
import {
  getInitializationOptions,
  isEqual,
  useBaseViewerInitializer,
} from "@szewtwin/viewer-react";
import { useEffect, useMemo, useState } from "react";

import { DesktopInitializer } from "../services/Initializer.js";
import type { DesktopInitializerParams } from "../types.js";

export const useDesktopViewerInitializer = (
  options: DesktopInitializerParams
) => {
  const [desktopViewerInitOptions, setDesktopViewerInitOptions] =
    useState<ViewerInitializerParams>();
  const [desktopViewerInitalized, setDesktopViewerInitalized] = useState(false);
  const baseViewerInitialized = useBaseViewerInitializer(
    options,
    !desktopViewerInitalized
  );

  // only re-initialize when initialize options change
  const initializationOptions = useMemo(
    () => getInitializationOptions(options),
    [options]
  );

  useEffect(() => {
    if (
      !desktopViewerInitOptions ||
      !isEqual(initializationOptions, desktopViewerInitOptions)
    ) {
      setDesktopViewerInitalized(false);
      setDesktopViewerInitOptions(initializationOptions);
      void DesktopInitializer.startDesktopViewer(options).then(() => {
        void DesktopInitializer.initialized.then(() => {
          setDesktopViewerInitalized(true);
        });
      });
    }
  }, [options, desktopViewerInitOptions, initializationOptions]);

  return baseViewerInitialized && desktopViewerInitalized;
};
