/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type {
  BlankConnectionProps,
  IVaultConnection,
} from "@szewtwin/core-frontend";
import { BlankConnection } from "@szewtwin/core-frontend";

import type { ModelLoaderProps, RequiredViewerProps } from "../../types.js";
import { openLocalIVault, openRemoteIVault } from "./IVaultService.js";

type BlankConnectionInitializationProps = {
  szewTwinId?: string;
  blankConnectionProps: BlankConnectionProps;
};
/**
 * Create a blank connection with default props
 * @param BlankConnectionInitializationProps
 * @returns BlankConnection
 */
export const createBlankConnection = ({
  szewTwinId,
  blankConnectionProps,
}: BlankConnectionInitializationProps) =>
  BlankConnection.create({
    szewTwinId,
    ...blankConnectionProps,
  });

/**
 * Creates a remote, local, or blank connection
 * based on RequiredViewerProps passed.
 * @param RequiredViewerProps
 * @returns Promise<IVaultConnection | undefined>
 */
export const openConnection = async (
  options: RequiredViewerProps
): Promise<IVaultConnection | undefined> => {
  if (options.szewTwinId && options.iVaultId) {
    return await openRemoteIVault(
      options.szewTwinId,
      options.iVaultId,
      options.changeSetId
    );
  }

  if (options.filePath) {
    return await openLocalIVault(options.filePath, options.readonly);
  }

  if (options.extents && options.location) {
    return createBlankConnection({
      szewTwinId: options.szewTwinId,
      blankConnectionProps: {
        extents: options.extents,
        location: options.location,
        name: "Blank Connection",
      },
    });
  }

  return;
};

export const gatherRequiredViewerProps = ({
  szewTwinId,
  iVaultId,
  filePath,
  readonly,
  extents,
  location,
  changeSetId,
}: ModelLoaderProps): RequiredViewerProps | undefined => {
  if (filePath) {
    return { filePath, readonly };
  }

  if (iVaultId && szewTwinId) {
    return { iVaultId, szewTwinId, changeSetId };
  }

  if (extents && location) {
    return { szewTwinId, extents, location };
  }

  return;
};
