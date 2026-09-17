/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/


import type { DefaultNavigationTools } from "@szewtwin/appui-react";
import { StandardNavigationToolsUiItemsProvider } from "@szewtwin/appui-react";

export class ViewerNavigationToolsProvider extends StandardNavigationToolsUiItemsProvider {
  constructor(private defaultItems?: DefaultNavigationTools) {
    super({
      horizontal: {
        fitView: true,
        panView: true,
        rotateView: true,
        viewUndoRedo: true,
        windowArea: true,
        ...defaultItems?.horizontal,
      },
      vertical: {
        toggleCamera: true,
        walk: true,
        ...defaultItems?.vertical,
      },
    });
  }

  override get id(): string {
    return "ViewerDefaultNavigationTools";
  }
}
