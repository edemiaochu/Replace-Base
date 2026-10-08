/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { AppNotificationManager } from "@szewtwin/appui-react";
import { BrowserAuthorizationClient } from "@szewtwin/browser-authorization";
import {
  MeasureTools,
  MeasureToolsUiItemsProvider,
} from "@szewtwin/measure-tools-react";
import {
  AncestorsNavigationControls,
  CopyPropertyTextContextMenuItem,
  createPropertyGrid,
  PropertyGridManager,
  ShowHideNullValuesSettingsMenuItem,
} from "@szewtwin/property-grid-react";
import {
  CategoriesTreeComponent,
  createTreeWidget,
  ModelsTreeComponent,
  TreeWidget,
} from "@szewtwin/tree-widget-react";
import type { ViewerBackstageItem } from "@szewtwin/web-viewer-react";
import {
  Viewer,
  ViewerContentToolsProvider,
  ViewerNavigationToolsProvider,
  ViewerStatusbarItemsProvider,
} from "@szewtwin/web-viewer-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// import { LocalExtensionProvider, RemoteExtensionProvider } from "@szewtwin/core-frontend";
import { ReactComponent as SZEWtwin } from "../../images/szewtwin.svg";
import {
  unifiedSelectionStorage,
} from "../../selectionStorage";
import { history } from "../routing";

/**
 * Test a viewer that uses auth configuration provided at startup
 * @returns
 */
const ViewerHome: React.FC = () => {
  const [szewTwinId, setSZEWTwinId] = useState(import.meta.env.IMJS_AUTH_CLIENT_SZEWTWIN_ID);
  const [iVaultId, setIVaultId] = useState(
    import.meta.env.IMJS_AUTH_CLIENT_IVAULT_ID
  );
  const [changesetId, setChangesetId] = useState(
    import.meta.env.IVJS_AUTH_CLIENT_CHANGESET_ID
  );

  const authClient = useMemo(
    () =>
      new BrowserAuthorizationClient({
        scope: import.meta.env.IVJS_AUTH_CLIENT_SCOPES ?? "",
        clientId: import.meta.env.IVJS_AUTH_CLIENT_CLIENT_ID ?? "",
        redirectUri: import.meta.env.IVJS_AUTH_CLIENT_REDIRECT_URI ?? "",
        postSignoutRedirectUri: import.meta.env.IVJS_AUTH_CLIENT_LOGOUT_URI,
        responseType: "code",
      }),
    []
  );

  const login = useCallback(async () => {
    try {
      await authClient.signInSilent();
    } catch {
      await authClient.signIn();
    }
  }, [authClient]);

  useEffect(() => {
    void login();
  }, [login]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("szewTwinId")) {
      setSZEWTwinId(urlParams.get("szewTwinId") as string);
    }
    if (urlParams.has("iVaultId")) {
      setIVaultId(urlParams.get("iVaultId") as string);
    }
    if (urlParams.has("changesetId")) {
      setChangesetId(urlParams.get("changesetId") as string);
    }
  }, []);

  useEffect(() => {
    let url = `viewer?szewTwinId=${szewTwinId}`;

    if (iVaultId) {
      url = `${url}&iVaultId=${iVaultId}`;
    }

    if (changesetId) {
      url = `${url}&changesetId=${changesetId}`;
    }
    history.push(url);
  }, [szewTwinId, iVaultId, changesetId]);

  const Loader = () => {
    return <div>Things are happening...</div>;
  };

  const onIVaultAppInit = useCallback(async () => {
    await TreeWidget.initialize();
    await PropertyGridManager.initialize();
    await MeasureTools.startup();
  }, []);

  const backstageItems: ViewerBackstageItem[] = [
    {
      id: "BS1",
      execute: () => console.log("BS1"),
      groupPriority: 10,
      itemPriority: 30,
      label: "Backstage Items Provider 1",
    },
  ];

  return (
    <div style={{ height: "100vh" }}>
      <Viewer
        authClient={authClient}
        szewTwinId={szewTwinId ?? ""}
        iVaultId={iVaultId ?? ""}
        changeSetId={changesetId}
        loadingComponent={<Loader />}
        mapLayerOptions={{
          BingMaps: {
            key: "key",
            value: import.meta.env.IVJS_BING_MAPS_KEY ?? "",
          },
        }}
        notifications={new AppNotificationManager()}
        enablePerformanceMonitors={true}
        onIVaultAppInit={onIVaultAppInit}
        uiProviders={[
          new ViewerNavigationToolsProvider(),
          new ViewerContentToolsProvider({
            vertical: {
              measureGroup: false,
            },
          }),
          new ViewerStatusbarItemsProvider(),
          {
            id: "TreeWidgetUIProvider",
            getWidgets: () => [
              createTreeWidget({
                trees: [
                  {
                    id: ModelsTreeComponent.id,
                    getLabel: () => ModelsTreeComponent.getLabel(),
                    render: (props) => (
                      <ModelsTreeComponent
                        getSchemaContext={(iVault) => iVault.schemaContext}
                        density={props.density}
                        selectionStorage={unifiedSelectionStorage}
                        selectionMode={"extended"}
                        onPerformanceMeasured={props.onPerformanceMeasured}
                        onFeatureUsed={props.onFeatureUsed}
                      />
                    ),
                  },
                  {
                    id: CategoriesTreeComponent.id,
                    getLabel: () => CategoriesTreeComponent.getLabel(),
                    render: (props) => (
                      <CategoriesTreeComponent
                        getSchemaContext={(iVault) => iVault.schemaContext}
                        density={props.density}
                        selectionStorage={unifiedSelectionStorage}
                        onPerformanceMeasured={props.onPerformanceMeasured}
                        onFeatureUsed={props.onFeatureUsed}
                      />
                    ),
                  },
                ],
                onPerformanceMeasured: (feature, elapsedTime) => {
                  console.log(`TreeWidget [${feature}] took ${elapsedTime} ms`);
                },
                onFeatureUsed: (feature) => {
                  console.log(`TreeWidget [${feature}] used`);
                },
              }),
            ],
          },
          {
            id: "PropertyWidgetUIProvider",
            getWidgets: () => [
              createPropertyGrid({
                autoExpandChildCategories: true,
                ancestorsNavigationControls: (props) => (
                  <AncestorsNavigationControls {...props} />
                ),
                contextMenuItems: [
                  (props) => <CopyPropertyTextContextMenuItem {...props} />,
                ],
                settingsMenuItems: [
                  (props) => (
                    <ShowHideNullValuesSettingsMenuItem
                      {...props}
                      persist={true}
                    />
                  ),
                ],
                selectionStorage: unifiedSelectionStorage,
              }),
            ],
          },
          new MeasureToolsUiItemsProvider(),
        ]}
        // extensions={[
        //   new LocalExtensionProvider({
        //     manifestPromise: LocalExtension.manifestPromise,
        //     main: LocalExtension.main,
        //   }),
        //   new RemoteExtensionProvider({
        //     jsUrl: "http://localhost:3001/dist/index.js",
        //     manifestUrl: "http://localhost:3001/package.json",
        //   }),
        // ]}
        defaultUiConfig={{ cornerButton: <SZEWtwin /> }}
        // renderSys={{doIdleWork: true}}
        selectionStorage={unifiedSelectionStorage}
        selectionScopes={{
          active: "element",
          available: availableSelectionScopes,
        }}
      />
    </div>
  );
};

const availableSelectionScopes = {
  element: {
    label: "Element",
    def: { id: "element" as const },
  },
  assembly: {
    label: "Assembly",
    def: { id: "element" as const, ancestorLevel: 1 },
  },
  "top-assembly": {
    label: "Top assembly",
    def: { id: "element" as const, ancestorLevel: -1 },
  }
};

export default ViewerHome;
