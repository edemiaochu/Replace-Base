/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { UiItemsProvider } from "@szewtwin/appui-react";
import { UiItemsManager } from "@szewtwin/appui-react";
import { useEffect } from "react";

export function useUiProviders(uiProviders?: UiItemsProvider[]): void {
  useEffect(() => {
    uiProviders?.forEach((uiProvider) => {
      UiItemsManager.register(uiProvider);
    });

    return () => {
      uiProviders?.forEach((uiProvider) => {
        UiItemsManager.unregister(uiProvider.id);
      });
    };
  }, [uiProviders]);
}
