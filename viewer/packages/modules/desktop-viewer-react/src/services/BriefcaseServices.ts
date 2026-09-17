/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Guid } from "@szewtwin/core-szewec";
import type { BriefcaseConnection } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";

import { ModelStatus } from "../types.js";

export const getBriefcaseStatus = async ({
  szewTwinId,
  iVaultId,
  changeset,
}: BriefcaseConnection): Promise<ModelStatus> => {
  if (szewTwinId !== Guid.empty) {
    try {
      const accessToken = await IVaultApp.getAccessToken();
      // get the online version
      const remoteChangeset = await IVaultApp.hubAccess?.getLatestChangeset({
        iVaultId,
        accessToken,
      });

      const hasChanges = changeset.id !== remoteChangeset?.id;
      if (hasChanges) {
        return ModelStatus.OUTDATED;
      } else {
        return ModelStatus.UPTODATE;
      }
    } catch (error) {
      console.error(error);
      return ModelStatus.ERROR;
    }
  } else {
    return ModelStatus.SNAPSHOT;
  }
};
