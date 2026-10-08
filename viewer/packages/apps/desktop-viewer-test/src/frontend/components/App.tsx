/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { DesktopInitializerParams } from "@szewtwin/desktop-viewer-react";
import { useConnectivity } from "@szewtwin/desktop-viewer-react";
import { useDesktopViewerInitializer } from "@szewtwin/desktop-viewer-react";
import { SvgIVaultLoader } from "@szewtwin/szewtwinui-illustrations-react";
import { PageLayout } from "@szewtwin/szewtwinui-layouts-react";
import { Flex, ThemeProvider } from "@szewtwin/szewtwinui-react";
import {
  MeasurementActionToolbar,
  MeasureTools,
} from "@szewtwin/measure-tools-react";
import { PropertyGridManager } from "@szewtwin/property-grid-react";
import { TreeWidget } from "@szewtwin/tree-widget-react";
import { useCallback, useEffect, useMemo } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";

import { viewerRpcs } from "../../common/ViewerConfig";
import { SZEWTwinViewerApp } from "../app/SZEWTwinViewerApp";
import { SettingsContextProvider } from "../services/SettingsContext";
import { HomeRoute, IVaultsRoute, SZEWTwinsRoute, ViewerRoute } from "./routes";
import { unifiedSelectionStorage } from "../selectionStorage";
import { registerPlaceTools } from "../tools/PlaceElementTools";

const App = () => {
  window.SZEWTWIN_VIEWER_HOME = window.location.origin;

  const onIVaultAppInit = useCallback(async () => {
    await TreeWidget.initialize();
    await PropertyGridManager.initialize();
    await MeasureTools.startup();
    MeasurementActionToolbar.setDefaultActionProvider();
    registerPlaceTools();
  }, []);

  const desktopInitializerProps = useMemo<DesktopInitializerParams>(
    () => ({
      clientId: import.meta.env.IVJS_VIEWER_CLIENT_ID ?? "",
      rpcInterfaces: viewerRpcs,
      additionalI18nNamespaces: ["szewTwinDesktopViewer"],
      enablePerformanceMonitors: true,
      selectionStorage: unifiedSelectionStorage,
      onIVaultAppInit,
    }),
    [onIVaultAppInit]
  );

  const initialized = useDesktopViewerInitializer(desktopInitializerProps);
  const connectivityStatus = useConnectivity();

  useEffect(() => {
    if (initialized) {
      // setup connectivity events to let the backend know the status
      void SZEWTwinViewerApp.ipcCall.setConnectivity(connectivityStatus);
    }
  }, [initialized, connectivityStatus]);

  return (
    <ThemeProvider theme="dark" style={{ height: "100%" }}>
      {initialized ? (
        <BrowserRouter>
          <SettingsContextProvider>
            <PageLayout>
              <Routes>
                <Route
                  element={
                    <PageLayout.Content padded>
                      <Outlet />
                    </PageLayout.Content>
                  }
                >
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/szewtwins/:szewTwinId" element={<IVaultsRoute />} />
                  <Route path="/szewtwins" element={<SZEWTwinsRoute />} />
                </Route>
                <Route
                  element={
                    <PageLayout.Content>
                      <Outlet />
                    </PageLayout.Content>
                  }
                >
                  <Route path="/viewer" element={<ViewerRoute />} />
                </Route>
              </Routes>
            </PageLayout>
          </SettingsContextProvider>
        </BrowserRouter>
      ) : (
        <Flex justifyContent="center" style={{ height: "100%" }}>
          <SvgIVaultLoader
            data-testid="loader-wrapper"
            style={{
              height: "64px",
              width: "64px",
            }}
          />
        </Flex>
      )}
    </ThemeProvider>
  );
};

export default App;
