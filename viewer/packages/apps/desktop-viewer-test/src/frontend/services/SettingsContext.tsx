/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { createContext, useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router";

import type { ViewerFile, ViewerSettings } from "../../common/ViewerConfig";
import { SZEWTwinViewerApp } from "../app/SZEWTwinViewerApp";

interface ISettingsContext {
  settings: ViewerSettings;
  addRecent: (
    path: string,
    iVaultName?: string,
    szewTwinId?: string,
    iVaultId?: string
  ) => Promise<void>;
  checkFileExists: (file: ViewerFile) => Promise<boolean>;
}

interface SettingsContextProviderProps {
  children: React.ReactNode;
}

export const SettingsContextProvider = ({
  children,
}: SettingsContextProviderProps) => {
  const [settings, setSettings] = useState<ViewerSettings>({});
  const location = useLocation();

  const getRecentSettings = useCallback(async () => {
    const updatedSettings = await SZEWTwinViewerApp.ipcCall.getSettings();
    setSettings(updatedSettings);
  }, []);

  const addRecent = useCallback(
    async (
      path: string,
      iVaultName?: string,
      szewTwinId?: string,
      iVaultId?: string
    ) => {
      // Getting file name from path incase there is no iVault name.
      const sections = path.split("/");
      const fileName = sections[sections.length - 1];

      await SZEWTwinViewerApp.ipcCall.addRecentFile({
        szewTwinId,
        iVaultId,
        displayName: iVaultName ?? fileName,
        path: path,
      });
      await getRecentSettings();
    },
    [getRecentSettings]
  );

  const checkFileExists = useCallback(
    async (file: ViewerFile) => {
      const exists = await SZEWTwinViewerApp.ipcCall.checkFileExists(file);
      if (!exists) {
        await SZEWTwinViewerApp.ipcCall.removeRecentFile(file);
        await getRecentSettings();
      }
      return exists;
    },
    [getRecentSettings]
  );

  useEffect(() => {
    void getRecentSettings();
  }, [getRecentSettings, location]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        addRecent,
        checkFileExists,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const SettingsContext = createContext<ISettingsContext>(
  {} as ISettingsContext
);
