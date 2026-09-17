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
import type { Id64String } from "@szewtwin/core-szewec";
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
  createNewIVault: (args: CreateNewIVaultArgs) => Promise<CreateNewIVaultResult>;
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

/** Arguments for ViewerIpc.createNewIVault. */
export interface CreateNewIVaultArgs {
  /** The absolute path of the new .bim file. A ".bim" extension is appended if the path has no ".bim"/".ibim" extension. */
  filePath: string;
  /** Name for the root Subject of the new iVault. Defaults to the file name (without extension). */
  name?: string;
}

/** Result of ViewerIpc.createNewIVault. */
export interface CreateNewIVaultResult {
  /** The absolute path of the created file. */
  filePath: string;
  /** The Id of the default PhysicalModel initialized in the new iVault. */
  defaultModelId: Id64String;
  /** The Id of the default SpatialCategory initialized in the new iVault. */
  defaultCategoryId: Id64String;
}
