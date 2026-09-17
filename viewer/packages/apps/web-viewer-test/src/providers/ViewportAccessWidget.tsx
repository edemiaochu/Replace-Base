/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { UiItemsProvider, Widget } from "@szewtwin/appui-react";
import { StagePanelLocation, WidgetState } from "@szewtwin/appui-react";
import { useActiveViewport } from "@szewtwin/appui-react";
import { Button } from "@szewtwin/szewtwinui-react";
import { useEffect } from "react";

const ViewportOnlyWidget: React.FunctionComponent<{
  onSampleIVaultChange: (iVaultId: string) => void;
}> = (props: { onSampleIVaultChange: (iVaultId: string) => void }) => {
  const viewport = useActiveViewport();

  /** Load the images on widget startup */
  useEffect(() => {
    if (viewport?.iVault.iVaultId) {
      // eslint-disable-next-line no-console
      console.log(
        `Setting up sample widget with iVaultId: ${viewport.iVault.iVaultId}`
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport]);

  const toggleModel = () => {
    const iVaultId1 = import.meta.env.IMJS_AUTH_CLIENT_IVAULT_ID;
    const iVaultId2 = import.meta.env.IMJS_AUTH_CLIENT_IVAULT_ID2;
    let iVaultId = iVaultId1;
    if (!iVaultId || viewport?.iVault.iVaultId === iVaultId1) {
      iVaultId = iVaultId2;
    }
    if (iVaultId) {
      props.onSampleIVaultChange(iVaultId);
    }
  };

  // Display drawing and sheet options in separate sections.
  return (
    <div className="sample-options">
      <Button onClick={toggleModel}>Switch iVault</Button>
    </div>
  );
};

export class ViewportWidgetProvider implements UiItemsProvider {
  public readonly id: string = "ViewportWidgetProvider";
  private _onSampleiVaultInfoChange: (iVaultId: string) => void;
  constructor(onSampleiVaultInfoChange: (iVaultId: string) => void) {
    this._onSampleiVaultInfoChange = onSampleiVaultInfoChange;
  }

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation
  ): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Right) {
      widgets.push({
        id: "ViewportWidgetProvider",
        label: "Viewport Widget Selector",
        defaultState: WidgetState.Floating,
        content: (
          <ViewportOnlyWidget
            onSampleIVaultChange={this._onSampleiVaultInfoChange}
          />
        ),
      });
    }
    return widgets;
  }
}
