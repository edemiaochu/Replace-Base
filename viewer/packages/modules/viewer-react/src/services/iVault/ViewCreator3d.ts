/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/*
API for creating a 3D default view for an iVault.
Either takes in a list of modelIds, or displays all 3D models by default.
*/

import { Id64 } from "@szewtwin/core-szewec";
import type { ScreenViewport, ViewState } from "@szewtwin/core-frontend";
import {
  FitViewTool,
  IVaultApp,
  StandardViewId,
  ViewCreator3d as ViewCreator,
} from "@szewtwin/core-frontend";

import type { ViewerViewCreator3dOptions } from "../../types.js";
import { ViewerPerformance } from "../telemetry/index.js";

/**
 * API for creating a 3D default [[ViewState3d]] for an iVault. @see [[ViewCreator2d]] to create a view for a 2d model.
 * Example usage:
 * ```ts
 * const viewCreator = new ViewCreator3d(ivault);
 * const defaultView = await viewCreator.createDefaultView({skyboxOn: true});
 * ```
 * @public
 */
export class ViewCreator3d extends ViewCreator {
  /**
   * Creates a default [[ViewState3d]] based on the model ids passed in. If no model ids are passed in, all 3D models in the iVault are used.
   * @param [options] Options for creating the view.
   * @param [modelIds] Ids of models to display in the view.
   * @throws [IVaultError]($common) If no 3d models are found in the iVault.
   */
  public override async createDefaultView(
    options?: ViewerViewCreator3dOptions,
    modelIds?: string[]
  ): Promise<ViewState> {
    const viewState = await super.createDefaultView(options, modelIds);

    if (viewState.iVault.isOpen) {
      // configure the view
      IVaultApp.viewManager.onViewOpen.addOnce((viewPort: ScreenViewport) => {
        if (viewState.iVault.isOpen) {
          // Always start with the standard rotation to ISO, it can be adjusted using any of the other methods after.
          void IVaultApp.tools.run(FitViewTool.toolId, viewPort, true, false);
          viewPort.view.setStandardRotation(StandardViewId.Iso);

          // check for a custom configurer and execute
          if (options?.viewportConfigurer) {
            options.viewportConfigurer(viewPort);
            return;
          }

          // failing that, if there is a valid default view id, adjust the volume but otherwise retain the view as is
          if (Id64.isValidId64(viewState.id)) {
            if (options?.standardViewId) {
              viewState.setStandardRotation(options.standardViewId);
            }
            const range = viewState.computeFitRange();
            viewState.lookAtVolume(range, options?.vpAspect);
            return;
          }

          // no default view and no custom configurer
          // default execute the fitview tool and use the iso standard view after tile trees are loaded
          const tileTreesLoaded = () => {
            return new Promise((resolve, reject) => {
              const start = new Date();
              const intvl = setInterval(() => {
                if (viewPort.areAllTileTreesLoaded) {
                  ViewerPerformance.addMark("TilesLoaded");
                  ViewerPerformance.addMeasure(
                    "TileTreesLoaded",
                    "ViewerStarting",
                    "TilesLoaded"
                  );
                  clearInterval(intvl);
                  resolve(true);
                }
                const now = new Date();
                // after 20 seconds, stop waiting and fit the view
                if (now.getTime() - start.getTime() > 20000) {
                  reject();
                }
              }, 100);
            });
          };
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          tileTreesLoaded().finally(() => {
            void IVaultApp.tools.run(FitViewTool.toolId, viewPort, true, false);
            viewPort.view.setStandardRotation(
              options?.standardViewId ?? StandardViewId.Iso
            );
          });
        }
      });
    }

    ViewerPerformance.addMark("ViewStateCreation");
    ViewerPerformance.addMeasure(
      "ViewStateCreated",
      "ViewerStarting",
      "ViewStateCreation"
    );
    return viewState;
  }
}
