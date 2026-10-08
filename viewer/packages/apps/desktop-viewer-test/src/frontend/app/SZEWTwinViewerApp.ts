/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { AsyncFunction, PromiseReturnType } from "@szewtwin/core-szewec";
import type { IpcListener } from "@szewtwin/core-common";
import { IVaultApp, IpcApp } from "@szewtwin/core-frontend";
import type { OpenDialogOptions, SaveDialogOptions } from "electron";
import type { NavigateFunction } from "react-router-dom";

import type {
  CreateNewIVaultResult,
  ViewerConfig,
  ViewerIpc,
} from "../../common/ViewerConfig";
import { channelName } from "../../common/ViewerConfig";

export declare type PickAsyncMethods<T> = {
  [P in keyof T]: T[P] extends AsyncFunction ? T[P] : never;
};

type IpcMethods = PickAsyncMethods<ViewerIpc>;

export class SZEWTwinViewerApp {
  private static _config: ViewerConfig;
  private static _menuListener: IpcListener | undefined;

  private static _getFileName(iVaultName?: string) {
    return iVaultName ? iVaultName.replace(/\s/g, "") : "Untitled";
  }

  public static translate(key: string | string[], options?: any): string {
    return IVaultApp.localization.getLocalizedString(
      `szewTwinDesktopViewer:${key}`,
      options
    );
  }

  public static ipcCall = new Proxy({} as IpcMethods, {
    get(_target, key: keyof IpcMethods): AsyncFunction {
      const makeIpcCall =
        <T extends keyof IpcMethods>(methodName: T) =>
        async (args: Parameters<IpcMethods[T]>) =>
          IpcApp.callIpcChannel(  // eslint-disable-line @typescript-eslint/no-deprecated
            channelName,
            methodName,
            args
          ) as PromiseReturnType<ViewerIpc[T]>;

      switch (key) {
        case "getConfig":
          return async () => {
            if (!SZEWTwinViewerApp._config) {
              SZEWTwinViewerApp._config = await makeIpcCall("getConfig")([]);
            }
            return SZEWTwinViewerApp._config;
          };
        default:
          return makeIpcCall(key);
      }
    },
  });

  public static async getFile(): Promise<string | undefined> {
    const options: OpenDialogOptions = {
      title: SZEWTwinViewerApp.translate("open"),
      properties: ["openFile"],
      filters: [{ name: "iVaults", extensions: ["ibim", "bim"] }],
    };
    const val = await SZEWTwinViewerApp.ipcCall.openFile(options);

    return val.canceled || val.filePaths.length === 0
      ? undefined
      : val.filePaths[0];
  }

  public static initializeMenuListeners(
    navigate: NavigateFunction,
    addRecent: (
      path: string,
      iVaultName?: string,
      szewTwinId?: string,
      iVaultId?: string
    ) => Promise<void>
  ) {
    if (this._menuListener) {
      // initialize only once
      return;
    }
    this._menuListener = async (sender, arg) => {
      switch (arg) {
        case "open":
          const filePath = await SZEWTwinViewerApp.getFile();
          if (filePath) {
            void addRecent(filePath);
            await navigate(`/viewer`, { state: { filePath } });
          }
          break;
        case "download":
          await navigate("/szewtwins");
          break;
        case "home":
          await navigate("/");
          break;
        case "preferences":
          alert("Coming Soon!");
          break;
      }
    };
    IpcApp.addListener(channelName, this._menuListener);
  }

  public static async saveBriefcase(
    iVaultName?: string
  ): Promise<string | undefined> {
    const options: SaveDialogOptions = {
      title: SZEWTwinViewerApp.translate("saveBriefcase"),
      defaultPath: `${this._getFileName(iVaultName)}.bim`,
      filters: [{ name: "iVaults", extensions: ["ibim", "bim"] }],
    };
    const val = await SZEWTwinViewerApp.ipcCall.saveFile(options);

    return val.canceled || !val.filePath ? undefined : val.filePath;
  }

  public static async createIVault(): Promise<CreateNewIVaultResult | undefined> {
    const options: SaveDialogOptions = {
      title: SZEWTwinViewerApp.translate("createNewIVault"),
      defaultPath: "NewIVault.dtw",
      filters: [{ name: "iVaults", extensions: ["ibim", "bim"] }],
    };
    const val = await SZEWTwinViewerApp.ipcCall.saveFile(options);
    if (val.canceled || !val.filePath)
      return undefined;

    return SZEWTwinViewerApp.ipcCall.createNewIVault({ filePath: val.filePath });
  }
}
