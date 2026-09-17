/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IVaultApp } from "@szewtwin/core-frontend";
import { Flex } from "@szewtwin/szewtwinui-react";
import React from "react";

import { useAccessToken } from "../hooks/useAccessToken.js";
import { useBaseViewerInitializer } from "../hooks/useBaseViewerInitializer.js";
import type { ViewerProps } from "../types.js";
import { ErrorBoundary } from "./error/ErrorBoundary.js";
import IVaultLoader from "./iVault/IVaultLoader.js";

export const BaseViewer = ({
  productId,
  i18nUrlTemplate,
  onIVaultAppInit,
  additionalI18nNamespaces,
  enablePerformanceMonitors,
  ...loaderProps
}: ViewerProps) => {
  const viewerInitialized = useBaseViewerInitializer({
    productId,
    i18nUrlTemplate,
    onIVaultAppInit,
    additionalI18nNamespaces,
    enablePerformanceMonitors,
  });

  const accessToken = useAccessToken();
  const isBlankConnection =
    loaderProps.extents && loaderProps.location && !loaderProps.szewTwinId;

  return (
    <ErrorBoundary>
      {loaderProps.filePath || accessToken || isBlankConnection ? (
        viewerInitialized ? (
          <IVaultLoader {...loaderProps} />
        ) : (
          <Flex>
            {IVaultApp.localization.getLocalizedString(
              "szewTwinViewer:baseViewerInitializer.baseViewerInitializing"
            )}
          </Flex>
        )
      ) : (
        <Flex>
          {IVaultApp.localization.getLocalizedString(
            "szewTwinViewer:baseViewerInitializer.validTokenNeeded"
          )}
        </Flex>
      )}
    </ErrorBoundary>
  );
};
