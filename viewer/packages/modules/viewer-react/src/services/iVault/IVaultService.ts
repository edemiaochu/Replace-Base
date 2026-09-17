/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { UiFramework } from "@szewtwin/appui-react";
import { Guid, OpenMode } from "@szewtwin/core-szewec";
import { IVaultVersion } from "@szewtwin/core-common";
import type { IVaultConnection, ViewState } from "@szewtwin/core-frontend";
import {
  BriefcaseConnection,
  CheckpointConnection,
  IVaultApp,
  SnapshotConnection,
} from "@szewtwin/core-frontend";

import { createBlankViewState, ViewCreator3d } from "../../services/iVault/index.js";
import type {
  BlankConnectionViewState,
  ViewerViewCreator3dOptions,
  ViewerViewportControlOptions,
} from "../../types.js";

/** determine the proper version of the iVault to open
 * 1. If named versions exist, get the named version that contains the latest changeset
 * 2. If no named version exists, return the latest changeset
 */
const getVersion = async (
  iVaultId: string,
  changeSetId?: string
): Promise<IVaultVersion> => {
  if (changeSetId) {
    return IVaultVersion.asOfChangeSet(changeSetId);
  }

  const accessToken = await IVaultApp.authorizationClient?.getAccessToken();
  if (accessToken && IVaultApp.hubAccess) {
    try {
      const changeset = await IVaultApp.hubAccess.getChangesetFromNamedVersion({
        iVaultId,
        accessToken,
      });
      return IVaultVersion.asOfChangeSet(changeset.id);
    } catch {
      // default to the latest version
      return IVaultVersion.latest();
    }
  }
  return IVaultVersion.latest();
};

/** open and return an IVaultConnection from a project's wsgId and an ivault's wsgId */
export const openRemoteIVault = async (
  szewTwinId: string,
  iVaultId: string,
  changeSetId?: string
): Promise<CheckpointConnection | undefined> => {
  try {
    // get the version to query
    const version = await getVersion(iVaultId, changeSetId);
    // create a new connection
    return await CheckpointConnection.openRemote(szewTwinId, iVaultId, version);
  } catch (error) {
    console.log(`Error opening the iVault connection: ${error}`);
    throw error;
  }
};

/**
 * Attempt to open a local briefcase or snapshot
 * @param fileName
 * @returns
 */
export const openLocalIVault = async (fileName: string, readonly = true) => {
  if (!readonly) {
    // Standalone files must be opened via openStandalone in read-write mode to support editing;
    // fall back to opening as a writable briefcase for non-standalone local files.
    try {
      return await BriefcaseConnection.openStandalone(fileName, OpenMode.ReadWrite);
    } catch {
      return await BriefcaseConnection.openFile({
        fileName,
        readonly: false,
      });
    }
  }
  try {
    // attempt to open as a briefcase
    const connection = await BriefcaseConnection.openFile({
      fileName,
      readonly,
    });
    if (connection.szewTwinId === Guid.empty) {
      // assume snapshot if there is no context id
      await connection.close();
      return await SnapshotConnection.openFile(fileName);
    }
    return connection;
  } catch {
    // if that fails, attempt to open as a snapshot
    return await SnapshotConnection.openFile(fileName);
  }
};

/**
 * Generate a viewstate and set it in UiFramework
 * @param connection \
 * @param viewportOptions
 * @param viewCreatorOptions
 * @param blankConnectionViewState
 * @returns
 */
export const getAndSetViewState = async (
  connection: IVaultConnection,
  viewportOptions?: ViewerViewportControlOptions,
  viewCreatorOptions?: ViewerViewCreator3dOptions,
  blankConnectionViewState?: BlankConnectionViewState
): Promise<ViewState | undefined> => {
  const viewState = await getViewState(
    connection,
    viewportOptions,
    viewCreatorOptions,
    blankConnectionViewState
  );
  if (viewState) {
    UiFramework.setDefaultViewState(viewState);
  }
  return viewState;
};

/**
 * Generate a viewstate
 * @param connection
 * @param viewportOptions
 * @param viewCreatorOptions
 * @param blankConnectionViewState
 * @returns
 */
export const getViewState = async (
  connection: IVaultConnection,
  viewportOptions?: ViewerViewportControlOptions,
  viewCreatorOptions?: ViewerViewCreator3dOptions,
  blankConnectionViewState?: BlankConnectionViewState
): Promise<ViewState | undefined> => {
  if (!connection.isBlankConnection() && connection.isClosed) {
    return;
  }
  let view: ViewState | undefined;
  if (viewportOptions?.viewState) {
    if (typeof viewportOptions?.viewState === "function") {
      view = await viewportOptions?.viewState(connection);
    } else {
      view = viewportOptions?.viewState;
    }
  }
  if (
    !viewportOptions?.alwaysUseSuppliedViewState &&
    (!view ||
      (view.iVault.iVaultId !== connection.iVaultId && connection.isOpen))
  ) {
    if (connection.isBlankConnection()) {
      view = createBlankViewState(connection, blankConnectionViewState);
    } else {
      // attempt to construct a default viewState
      const viewCreator = new ViewCreator3d(connection);
      view = await viewCreator.createDefaultView(viewCreatorOptions);
      UiFramework.setActiveSelectionScope("top-assembly"); // eslint-disable-line @typescript-eslint/no-deprecated
    }
  }
  return view;
};
