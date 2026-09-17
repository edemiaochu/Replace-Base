/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { IVaultHost, IVaultHostConfiguration, IpcHost } from "@szewtwin/core-backend";
import { Logger, LogLevel } from "@szewtwin/core-szewec";
import type { ElectronHostOptions } from "@szewtwin/core-electron/lib/cjs/ElectronBackend";
import { ElectronHost } from "@szewtwin/core-electron/lib/cjs/ElectronBackend";
import { DMSchemaRpcImpl } from "@szewtwin/ecschema-rpcinterface-impl";
import { EditCommandAdmin } from "@szewtwin/editor-backend";
import * as editorBuiltInCommands from "@szewtwin/editor-backend";
import { BackendIVaultsAccess } from "@szewtwin/ivaults-access-backend";
import { Presentation } from "@szewtwin/presentation-backend";
import * as dotenvFlow from "dotenv-flow";
import { Menu, shell } from "electron";
import type { MenuItemConstructorOptions } from "electron/main";
import * as path from "path";

import { AppLoggerCategory } from "../common/LoggerCategory";
import { channelName, viewerRpcs } from "../common/ViewerConfig";
import { appInfo } from "./AppInfo";
import ViewerHandler from "./ViewerHandler";

dotenvFlow.config();  

/** This is the function that gets called when we start szewTwinViewer via `electron ViewerMain.js` from the command line.
 * It runs in the Electron main process and hosts the iVaultjs backend (IVaultHost) code. It starts the render (frontend) process
 * that starts from the file "index.ts". That launches the viewer frontend (IVaultApp).
 */
const viewerMain = async () => {
  // Setup logging immediately to pick up any logging during IVaultHost.startup()
  Logger.initializeToConsole();
  Logger.setLevelDefault(LogLevel.Trace);
  Logger.setLevel(AppLoggerCategory.Backend, LogLevel.Info);

  const electronHost: ElectronHostOptions = {
    webResourcesPath: path.join(__dirname, "..", "..", "dist"),
    rpcInterfaces: viewerRpcs,
    developmentServer: process.env.NODE_ENV === "development",
    ipcHandlers: [ViewerHandler],
    iconName: "szewtwin-viewer.ico",
  };

  const iVaultHost = new IVaultHostConfiguration();
  iVaultHost.hubAccess = new BackendIVaultsAccess();

  await ElectronHost.startup({ electronHost, iVaultHost });

  // register the editor framework's built-in commands (element insertion for the placement tools)
  EditCommandAdmin.registerModule(editorBuiltInCommands);

  // Env bridge: IMJS_DISABLE_GCS_WORKSPACES=1 disables loading GCS reference databases from workspaces
  // (szewtwin/core/gcs/disableWorkspaces is a Workspace Setting, not an env var - see GeoCoordConfig.ts).
  if (process.env.IMJS_DISABLE_GCS_WORKSPACES) {
    IVaultHost.appWorkspace.settings.addDictionary(
      { name: "env-gcs-override", priority: 200 },
      { "szewtwin/core/gcs/disableWorkspaces": true },
    );
  }

  Presentation.initialize();

  await ElectronHost.openMainWindow({
    width: 1280,
    height: 800,
    show: true,
    title: appInfo.title,
    autoHideMenuBar: false,
  });

  DMSchemaRpcImpl.register();

  if (process.env.NODE_ENV === "development") {
    ElectronHost.mainWindow?.webContents.toggleDevTools();
  }
  // add the menu
  ElectronHost.mainWindow?.on("ready-to-show", createMenu);
  // open links in the system browser instead of Electron
  // remove this if you desire the default behavior instead
  ElectronHost.mainWindow?.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
};

const createMenu = () => {
  const isMac = process.platform === "darwin";

  const template = [
    {
      label: "File",
      submenu: [
        {
          id: "open-menu-item",
          label: "Open",
          click: () => {
            IpcHost.send(channelName, "open");
          },
          accelerator: "CommandOrControl+O",
        },
        {
          id: "download-menu-item",
          label: "Download",
          click: () => {
            IpcHost.send(channelName, "download");
          },
          accelerator: "CommandOrControl+D",
        },
        { type: "separator" },
        isMac
          ? { id: "close-menu-item", label: "Close", role: "close" }
          : { id: "close-menu-item", label: "Close", role: "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          id: "view-getting-started-menu-item",
          label: "Getting started",
          click: () => {
            IpcHost.send(channelName, "home");
          },
          accelerator: "CommandOrControl+G",
        },
      ],
    },
  ] as MenuItemConstructorOptions[];

  if (isMac) {
    const windowMenu: MenuItemConstructorOptions[] = [
      {
        label: "Minimize",
        role: "minimize",
      },
      {
        label: "Zoom",
        role: "zoom",
        accelerator: "CommandOrControl+Alt+Z",
      },
    ];

    // add a reload menu item for development only
    if (process.env.NODE_ENV === "development") {
      windowMenu.push({
        label: "Reload",
        role: "reload",
      });
    }

    template.push({
      label: "Window",
      submenu: windowMenu,
    });
    template.unshift({
      label: "szewTwin Viewer",
      role: "appMenu",
      submenu: [
        {
          label: "Preferences",
          click: () => {
            IpcHost.send(channelName, "preferences");
          },
        },
      ],
    } as MenuItemConstructorOptions);
  }

  const menu = Menu.buildFromTemplate(template as MenuItemConstructorOptions[]);

  Menu.setApplicationMenu(menu);
  ElectronHost.mainWindow?.setMenuBarVisibility(true);
  // this is overridden in ElectronHost and set to true so it needs to be...re-overriden??
  ElectronHost.mainWindow?.setAutoHideMenuBar(false);
};

try {
  void viewerMain();
} catch (error) {
  Logger.logError(AppLoggerCategory.Backend, error as string);
  process.exitCode = 1;
}
