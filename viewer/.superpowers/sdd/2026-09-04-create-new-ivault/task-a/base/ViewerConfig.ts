/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { InternetConnectivityStatus } from "@szewtwin/core-common";
import {
  IVaultReadRpcInterface,
  IVaultTileRpcInterface,
  szewTwinChannel,
  SnapshotIVaultRpcInterface,
} from "@szewtwin/core-common";
import { PresentationRpcInterface } from "@szewtwin/presentation-common";
import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
} from "electron";
import { DMSchemaRpcInterface } from "@szewtwin/ecschema-rpcinterface-common";

export const channelName = szewTwinChannel("desktop-viewer");

export interface ViewerIpc {
  getConfig: () => Promise<ViewerConfig>;
  openFile: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>;
  getSettings: () => Promise<ViewerSettings>;
  addRecentFile: (file: ViewerFile) => Promise<void>;
  removeRecentFile: (file: ViewerFile) => Promise<void>;
  checkFileExists: (file: ViewerFile) => Promise<boolean>;
  saveFile: (options: SaveDialogOptions) => Promise<SaveDialogReturnValue>;
  setConnectivity: (
    connectivityStatus: InternetConnectivityStatus
  ) => Promise<void>;
}

export interface ViewerConfig {
  snapshotName?: string;
  clientId: string;
  redirectUri: string;
  issuerUrl?: string;
}

/** RPC interfaces required by the viewer */
export const viewerRpcs = [
  IVaultReadRpcInterface,
  IVaultTileRpcInterface,
  PresentationRpcInterface,
  SnapshotIVaultRpcInterface, // eslint-disable-line @typescript-eslint/no-deprecated
  DMSchemaRpcInterface,
];

export interface ViewerFile {
  displayName: string;
  path: string;
  szewTwinId?: string;
  iVaultId?: string;
}

export interface ViewerSettings {
  defaultRecent?: boolean;
  recents?: ViewerFile[];
}
