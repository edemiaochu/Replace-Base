/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IVaultConnection } from "@szewtwin/core-frontend";
import { createStorage } from "@szewtwin/unified-selection";

const unifiedSelectionStorage = createStorage();

IVaultConnection.onClose.addListener((ivault) => {
  unifiedSelectionStorage.clearStorage({ ivaultKey: ivault.key });
});

export { unifiedSelectionStorage };
