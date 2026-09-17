/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { IVaultConnection } from "@szewtwin/core-frontend";
import {
  createDMSchemaProvider,
  createDMSqlQueryExecutor,
} from "@szewtwin/presentation-core-interop";
import { createCachingDMClassHierarchyInspector } from "@szewtwin/presentation-shared";
import {
  enableUnifiedSelectionSyncWithIVault,
  SelectionStorage,
} from "@szewtwin/unified-selection";
import React from "react";

type SelectionScope = ReturnType<
  Parameters<
    typeof enableUnifiedSelectionSyncWithIVault
  >[0]["activeScopeProvider"]
>;

interface UseUnifiedSelectionSyncProps {
  iVaultConnection?: IVaultConnection;
  selectionStorage?: SelectionStorage;
  activeSelectionScope: SelectionScope;
}

/** @internal */
export function useUnifiedSelectionSync({
  iVaultConnection,
  selectionStorage,
  activeSelectionScope,
}: UseUnifiedSelectionSyncProps) {
  const activeScope = React.useRef<SelectionScope>(activeSelectionScope);
  React.useEffect(() => {
    activeScope.current = activeSelectionScope;
  }, [activeSelectionScope]);

  React.useEffect(() => {
    if (!iVaultConnection || !selectionStorage) {
      return;
    }
    const { schemaContext } = iVaultConnection;
    return enableUnifiedSelectionSyncWithIVault({
      ivaultAccess: {
        ...createDMSqlQueryExecutor(iVaultConnection),
        ...createCachingDMClassHierarchyInspector({
          schemaProvider: createDMSchemaProvider(schemaContext),
        }),
        key: iVaultConnection.key,
        hiliteSet: iVaultConnection.hilited,
        selectionSet: iVaultConnection.selectionSet,
      },
      selectionStorage,
      activeScopeProvider: () => activeScope.current,
    });
  }, [iVaultConnection, selectionStorage]);
}
