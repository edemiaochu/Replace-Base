/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/


import {
  ContentGroup,
  ContentGroupProvider,
  StandardContentLayouts,
  UiFramework,
} from "@szewtwin/appui-react";
import type { ScreenViewport } from "@szewtwin/core-frontend";
import { ViewportComponent } from "@szewtwin/ivault-components-react";
import { viewWithUnifiedSelection } from "@szewtwin/presentation-components";
import React from "react";

import { getAndSetViewState } from "../../../services/iVault/index.js";
import type {
  BlankConnectionViewState,
  ViewerViewCreator3dOptions,
  ViewerViewportControlOptions,
} from "../../../types.js";

const UnifiedSelectionViewport = viewWithUnifiedSelection(ViewportComponent); // eslint-disable-line @typescript-eslint/no-deprecated

/**
 * Provide a default content group to the default frontstage
 */
export class DefaultContentGroupProvider extends ContentGroupProvider {
  private _viewportOptions: ViewerViewportControlOptions | undefined;
  private _blankConnectionViewState: BlankConnectionViewState | undefined;
  private _viewCreatorOptions: ViewerViewCreator3dOptions | undefined;
  private _isUsingDeprecatedSelectionManager: boolean | undefined;

  constructor(
    viewportOptions?: ViewerViewportControlOptions,
    viewCreatorOptions?: ViewerViewCreator3dOptions,
    blankConnectionViewStateOptions?: BlankConnectionViewState,
    isUsingDeprecatedSelectionManager?: boolean
  ) {
    super();
    this._viewportOptions = viewportOptions;
    this._blankConnectionViewState = blankConnectionViewStateOptions;
    this._viewCreatorOptions = viewCreatorOptions;
    this._isUsingDeprecatedSelectionManager = isUsingDeprecatedSelectionManager;
  }

  public async contentGroup(): Promise<ContentGroup> {
    const iVaultConnection = UiFramework.getIVaultConnection();
    if (!iVaultConnection) {
      throw "Never expected to get here without an iVaultConnection";
    }

    const viewState = await getAndSetViewState(
      iVaultConnection,
      this._viewportOptions,
      this._viewCreatorOptions,
      this._blankConnectionViewState
    );

    return new ContentGroup({
      id: "szewTwinViewer.default-content-group",
      layout: StandardContentLayouts.singleView,
      contents: [
        {
          id: this._isUsingDeprecatedSelectionManager
            ? "szewTwinViewer.UnifiedSelectionViewport"
            : "szewTwinViewer.Viewport",
          classId: "",
          content: (
            <ViewportWithOverlay
              viewState={viewState}
              ivault={iVaultConnection}
              deprecatedSelectionManager={
                this._isUsingDeprecatedSelectionManager
              }
              supplyViewOverlay={this._viewportOptions?.supplyViewOverlay}
            />
          ),
        },
      ],
    });
  }
}

type ViewportComponentProps = React.ComponentProps<typeof ViewportComponent>;

interface ViewportWithOverlayProps
  extends Pick<ViewportComponentProps, "viewState" | "ivault">,
    Pick<ViewerViewportControlOptions, "supplyViewOverlay"> {
  deprecatedSelectionManager?: boolean;
}

function ViewportWithOverlay(props: ViewportWithOverlayProps) {
  const { supplyViewOverlay } = props;

  const [viewport, setViewport] = React.useState<ScreenViewport | undefined>(
    undefined
  );
  const viewOverlay = React.useMemo(() => {
    if (!viewport || !supplyViewOverlay) {
      return null;
    }
    return supplyViewOverlay(viewport);
  }, [viewport, supplyViewOverlay]);
  return (
    <>
      {props.deprecatedSelectionManager ? (
        <UnifiedSelectionViewport
          viewState={props.viewState}
          ivault={props.ivault}
          controlId={"szewTwinViewer.UnifiedSelectionViewportControl"}
          viewportRef={setViewport}
        />
      ) : (
        <ViewportComponent
          viewState={props.viewState}
          ivault={props.ivault}
          controlId={"szewTwinViewer.ViewportControl"}
          viewportRef={setViewport}
        />
      )}
      {viewOverlay}
    </>
  );
}
