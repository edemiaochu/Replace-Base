/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IVaultVersion, SyncMode } from "@szewtwin/core-common";
import type { OnDownloadProgress } from "@szewtwin/core-frontend";
import { NativeApp } from "@szewtwin/core-frontend";
import { useCallback, useContext, useState } from "react";

import { SZEWTwinViewerApp } from "../app/SZEWTwinViewerApp";
import { SettingsContext } from "../services/SettingsContext";

export const useDownload = (
  iVaultId: string,
  iVaultName: string,
  szewTwinId: string
) => {
  const [progress, setProgress] = useState<number>();
  const userSettings = useContext(SettingsContext);

  const addRecent = useCallback(
    async (fileName: string) => {
      await userSettings.addRecent(fileName, iVaultName, szewTwinId, iVaultId);
    },
    [iVaultName, iVaultId, szewTwinId, userSettings]
  );

  const doDownload = useCallback(async () => {
    const fileName = await SZEWTwinViewerApp.saveBriefcase(iVaultName);
    if (fileName) {
      const progressCallback: OnDownloadProgress = (progress) => {
        const { loaded, total } = progress;
        const percent = (loaded / total) * 100;

        setProgress(percent);
        console.log(
          `Briefcase download progress (${loaded}/${total}) -> ${percent}%`
        );
      };

      const req = await NativeApp.requestDownloadBriefcase(
        szewTwinId,
        iVaultId,
        { syncMode: SyncMode.PullOnly, fileName, progressCallback },
        IVaultVersion.latest()
      );
      await req.downloadPromise;
      await addRecent(fileName);
      return fileName;
    }
  }, [iVaultId, iVaultName, szewTwinId, addRecent]);

  return { progress, doDownload };
};
