/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/


import "@szewec/icons-generic-webfont/dist/szewec-icons-generic-webfont.css";

import { StateManager, UiFramework } from "@szewtwin/appui-react";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";
import { SvgIVaultLoader } from "@szewtwin/szewtwinui-illustrations-react";
import { Flex } from "@szewtwin/szewtwinui-react";
import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";

import { useFrontstages, useUiProviders } from "../../hooks/index.js";
import { useUnifiedSelectionScopes } from "../../hooks/useUnifiedSelectionScopes.js";
import { useUnifiedSelectionSync } from "../../hooks/useUnifiedSelectionSync.js";
import {
  gatherRequiredViewerProps,
  getAndSetViewState,
  openConnection,
} from "../../services/iVault/index.js";
import { ViewerPerformance } from "../../services/telemetry/index.js";
import { isUnifiedSelectionProps, type ModelLoaderProps } from "../../types.js";
import {
  SelectionScopesContextProvider,
  SelectionStorageContextProvider,
} from "../app-ui/providers/index.js";
import { IVaultViewer } from "./IVaultViewer.js";

const IVaultLoader = React.memo((viewerProps: ModelLoaderProps) => {
  const {
    frontstages,
    defaultUiConfig,
    viewportOptions,
    viewCreatorOptions,
    blankConnectionViewState,
    uiProviders,
    loadingComponent,
  } = viewerProps;
  const { error, connection } = useConnection(viewerProps);

  useUiProviders(uiProviders);

  const selectionScopes = useUnifiedSelectionScopes({
    iVaultConnection: connection,
    selectionScopes: isUnifiedSelectionProps(viewerProps)
      ? viewerProps.selectionScopes
      : undefined,
  });
  useUnifiedSelectionSync({
    iVaultConnection: connection,
    activeSelectionScope: selectionScopes.activeScope.def,
    ...(isUnifiedSelectionProps(viewerProps)
      ? {
        selectionStorage: viewerProps.selectionStorage,
      }
      : {}),
  });

  const { finalFrontstages, noConnectionRequired, customDefaultFrontstage } =
    useFrontstages({
      frontstages,
      defaultUiConfig,
      viewportOptions,
      viewCreatorOptions,
      blankConnectionViewState,
      isUsingDeprecatedSelectionManager: !isUnifiedSelectionProps(viewerProps),
    });

  useEffect(() => {
    if (customDefaultFrontstage && connection) {
      // there is a custom default frontstage so we need to generate a viewstate for backwards compatibility
      // TODO next revisit/remove in the next major release
      void getAndSetViewState(
        connection,
        viewportOptions,
        viewCreatorOptions,
        blankConnectionViewState
      );
    }
  }, [
    customDefaultFrontstage,
    connection,
    viewportOptions,
    viewCreatorOptions,
    blankConnectionViewState,
  ]);

  if (error) {
    throw error;
  } else {
    return (
      <div style={{ height: "100%" }}>
        {finalFrontstages &&
        (connection || noConnectionRequired) &&
        StateManager.store ? ( // eslint-disable-line @typescript-eslint/no-deprecated
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          <Provider store={StateManager.store}>
            <SelectionStorageContextProvider
              selectionStorage={viewerProps.selectionStorage}
            >
              <SelectionScopesContextProvider selectionScopes={selectionScopes}>
                <IVaultViewer frontstages={finalFrontstages} />
              </SelectionScopesContextProvider>
            </SelectionStorageContextProvider>
          </Provider>
        ) : (
          <Flex justifyContent="center" style={{ height: "100%" }}>
            {loadingComponent ?? (
              <SvgIVaultLoader
                data-testid="loader-wrapper"
                style={{ width: "64px", height: "64px" }}
              />
            )}
          </Flex>
        )}
      </div>
    );
  }
});

function useConnection(viewerProps: ModelLoaderProps) {
  const [error, setError] = useState<Error>();
  const [connection, setConnection] = useState<IVaultConnection>();
  const onIVaultConnected = viewerProps.onIVaultConnected;

  useEffect(() => {
    setConnection(undefined);

    let disposed = false;
    const connectionPromise = getConnection(viewerProps);
    const prepareConnection = async () => {
      try {
        const ivaultConnection = await connectionPromise;
        if (disposed) {
          return;
        }

        setConnection(ivaultConnection);
        if (ivaultConnection) {
          // Tell the SyncUiEventDispatcher and StateManager about the iVaultConnection
          UiFramework.setIVaultConnection(ivaultConnection, true);

          if (onIVaultConnected) {
            await onIVaultConnected(ivaultConnection);
          }
        }
      } catch (error: unknown) {
        if (!disposed) {
          setError(error as Error);
        }
      }
    };

    void prepareConnection();

    return () => {
      disposed = true;
      const closeConnection = async () => {
        const ivaultConnection = await connectionPromise;
        if (ivaultConnection) {
          await ivaultConnection.close();
        }
      };
      void closeConnection();
    };
  }, [
    viewerProps.szewTwinId,
    viewerProps.iVaultId,
    viewerProps.changeSetId,
    viewerProps.filePath,
    onIVaultConnected,
  ]);

  return { connection, error };
}

async function getConnection(
  viewerProps: ModelLoaderProps
): Promise<IVaultConnection | undefined> {
  const requiredConnectionProps = gatherRequiredViewerProps(viewerProps);

  if (!requiredConnectionProps) {
    throw new Error(
      IVaultApp.localization.getLocalizedString([
        "szewTwinViewer",
        "missingConnectionProps",
      ])
    );
  }

  ViewerPerformance.addMark("IVaultConnectionStarted");
  ViewerPerformance.addMeasure(
    "IVaultConnecting",
    "ViewerStarting",
    "IVaultConnectionStarted"
  );

  // create a new ivaultConnection for the passed project and ivault ids or local file
  const ivaultConnection = await openConnection(requiredConnectionProps);

  ViewerPerformance.addMark("IVaultConnection");
  ViewerPerformance.addMeasure(
    "IVaultConnected",
    "ViewerStarting",
    "IVaultConnection"
  );

  return ivaultConnection;
}

export default IVaultLoader;
