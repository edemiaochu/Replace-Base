/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { ToolbarItem, UiItemsProvider } from "@szewtwin/appui-react";
import {
  StageUsage,
  ToolbarItemUtilities,
  ToolbarOrientation,
  ToolbarUsage,
} from "@szewtwin/appui-react";
import type { IVaultConnection } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";

/** Query the first id returned by an DMSQL statement, or undefined when the query has no rows. */
async function queryFirstId(ivault: IVaultConnection, dmsql: string): Promise<string | undefined> {
  for await (const row of ivault.createQueryReader(dmsql)) {
    return row[0] as string;
  }
  return undefined;
}

/** Make sure the active briefcase connection is ready for interactive element creation:
 * backfill editorToolSettings from the current view (first category/model is fine for
 * testing purposes, mirrors display-test-app's Viewer.updateActiveSettings) and lazily
 * enter an editing scope.
 * The default view for an iVault without elements is synthesized by ViewCreator3d, whose
 * category selector only contains categories that already have elements — for a freshly
 * created iVault that leaves it empty. In that case fall back to querying the iVault for
 * the first spatial category / physical model and add them to the view so that elements
 * created by the tools are actually displayed. */
async function ensureEditingReady(): Promise<boolean> {
  const vp = IVaultApp.viewManager.selectedView;
  if (!vp) {
    return false;
  }

  const ivault = vp.iVault;
  if (!ivault.isBriefcaseConnection()) {
    return false;
  }

  const view = vp.view;
  const settings = ivault.editorToolSettings;
  if (undefined === settings.category || !view.viewsCategory(settings.category)) {
    settings.category = undefined;
    for (const catId of view.categorySelector.categories) {
      settings.category = catId;
      break;
    }
    if (undefined === settings.category) {
      settings.category = await queryFirstId(ivault, "SELECT DMInstanceId FROM BisCore.SpatialCategory LIMIT 1");
      if (undefined !== settings.category) {
        view.categorySelector.addCategories([settings.category]);
      }
    }
  }

  if (undefined === settings.model || !view.viewsModel(settings.model)) {
    settings.model = undefined;
    if (view.is2d()) {
      settings.model = view.baseModelId;
    } else if (view.isSpatialView()) {
      for (const modId of view.modelSelector.models) {
        settings.model = modId;
        break;
      }
      if (undefined === settings.model) {
        settings.model = await queryFirstId(ivault, "SELECT DMInstanceId FROM BisCore.PhysicalModel LIMIT 1");
        if (undefined !== settings.model) {
          view.modelSelector.addModels([settings.model]);
        }
      }
    }
  }

  if (undefined === settings.category || undefined === settings.model) {
    return false; // CreateElementTool would refuse to start anyway...
  }

  if (!ivault.editingScope) {
    await ivault.enterEditingScope();
  }

  return true;
}

async function runPlaceTool(toolId: string): Promise<void> {
  if (!(await ensureEditingReady())) {
    return;
  }
  await IVaultApp.tools.run(toolId);
}

/** Adds toolbar buttons for the element placement tools (line string, sphere). */
export class PlaceToolsItemsProvider implements UiItemsProvider {
  public readonly id = "PlaceToolsItemsProvider";

  public provideToolbarItems(
    _stageId: string,
    stageUsage: string,
    toolbarUsage: ToolbarUsage,
    toolbarOrientation: ToolbarOrientation
  ): ToolbarItem[] {
    const items: ToolbarItem[] = [];
    if (
      stageUsage === StageUsage.General &&
      toolbarUsage === ToolbarUsage.ContentManipulation &&
      toolbarOrientation === ToolbarOrientation.Vertical
    ) {
      items.push(
        ToolbarItemUtilities.createActionItem({
          id: "PlaceToolsItemsProvider:PlaceLineString",
          itemPriority: 40,
          icon: <i className="icon-line" />,
          label: IVaultApp.localization.getLocalizedString([
            "szewTwinDesktopViewer",
            "placeTools.lineStringLabel",
          ]),
          execute: () => void runPlaceTool("PlaceLineString"),
        })
      );
      items.push(
        ToolbarItemUtilities.createActionItem({
          id: "PlaceToolsItemsProvider:PlaceSphere",
          itemPriority: 41,
          icon: <i className="icon-circle" />,
          label: IVaultApp.localization.getLocalizedString([
            "szewTwinDesktopViewer",
            "placeTools.sphereLabel",
          ]),
          execute: () => void runPlaceTool("PlaceSphere"),
        })
      );
      items.push(
        ToolbarItemUtilities.createActionItem({
          id: "PlaceToolsItemsProvider:MoveElements",
          itemPriority: 42,
          icon: <i className="icon-move" />,
          label: IVaultApp.localization.getLocalizedString([
            "szewTwinDesktopViewer",
            "placeTools.moveLabel",
          ]),
          execute: () => void runPlaceTool("MoveElements"),
        })
      );
      items.push(
        ToolbarItemUtilities.createActionItem({
          id: "PlaceToolsItemsProvider:DeleteElements",
          itemPriority: 43,
          icon: <i className="icon-delete" />,
          label: IVaultApp.localization.getLocalizedString([
            "szewTwinDesktopViewer",
            "placeTools.deleteLabel",
          ]),
          execute: () => void runPlaceTool("DeleteElements"),
        })
      );
    }
    return items;
  }
}
