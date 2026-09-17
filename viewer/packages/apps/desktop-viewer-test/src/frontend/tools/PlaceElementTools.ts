/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import {
  Code,
  ElementGeometry,
  FlatBufferGeometryStream,
  GeometricElementProps,
  PlacementProps,
} from "@szewtwin/core-common";
import {
  AccuDrawHintBuilder,
  BeButton,
  BeButtonEvent,
  ElementSetTool,
  IVaultApp,
  ToolAssistance,
  ToolAssistanceImage,
  ToolAssistanceInputMethod,
  ToolAssistanceInstruction,
  ToolAssistanceSection,
} from "@szewtwin/core-frontend";
import {
  LineString3d,
  Point3d,
  Sphere,
  Transform,
  Vector3d,
  YawPitchRollAngles,
} from "@szewtwin/core-geometry";
import { editorBuiltInCmdIds } from "@szewtwin/editor-common";
import {
  basicManipulationIpc,
  CreateElementWithDynamicsTool,
  EditTools,
  TransformElementsTool,
} from "@szewtwin/editor-frontend";

// Interactive element creation tools, ported from display-test-app's EditingTools.ts.
// They require the iVault to have been opened in read-write mode and use model/category
// from BriefcaseConnection.editorToolSettings.

/** Places a line string. Uses model and category from [[BriefcaseConnection.editorToolSettings]]. */
export class PlaceLineStringTool extends CreateElementWithDynamicsTool {
  public static override toolId = "PlaceLineString";
  public static override iconSpec = "icon-line";
  private readonly _points: Point3d[] = [];
  private _current?: LineString3d;
  private _startedCmd?: string;

  public override requireWriteableTarget(): boolean {
    // Inserting element will fail, but useful for testing AccuSnap and dynamics.
    return false;
  }

  protected async startCommand(): Promise<string> {
    if (undefined !== this._startedCmd)
      return this._startedCmd;
    return EditTools.startCommand<string>({ commandId: editorBuiltInCmdIds.cmdBasicManipulation, iVaultKey: this.iVault.key });
  }

  protected override setupAccuDraw(): void {
    const nPts = this._points.length;
    if (0 === nPts)
      return;

    const hints = new AccuDrawHintBuilder();

    // Rotate AccuDraw to last segment...
    if (nPts > 1 && !this._points[nPts - 1].isAlmostEqual(this._points[nPts - 2]))
      hints.setXAxis(Vector3d.createStartEnd(this._points[nPts - 2], this._points[nPts - 1]));

    hints.setOrigin(this._points[nPts - 1]);
    hints.sendHints();
  }

  protected override provideToolAssistance(_mainInstrText?: string, _additionalInstr?: ToolAssistanceInstruction[]): void {
    const nPts = this._points.length;
    const mainMsg = ToolAssistance.translatePrompt(0 === nPts ? "StartPoint" : (1 === nPts ? "EndPoint" : "IdentifyPoint"));
    const leftMsg = ToolAssistance.translateInput("AcceptPoint");
    const rightMsg = ToolAssistance.translateInput(nPts > 1 ? "Complete" : "Cancel");

    const mouseInstructions: ToolAssistanceInstruction[] = [];
    const touchInstructions: ToolAssistanceInstruction[] = [];

    if (!ToolAssistance.createTouchCursorInstructions(touchInstructions))
      touchInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.OneTouchTap, leftMsg, false, ToolAssistanceInputMethod.Touch));
    mouseInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.LeftClick, leftMsg, false, ToolAssistanceInputMethod.Mouse));

    touchInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.TwoTouchTap, rightMsg, false, ToolAssistanceInputMethod.Touch));
    mouseInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.RightClick, rightMsg, false, ToolAssistanceInputMethod.Mouse));

    const sections: ToolAssistanceSection[] = [];
    sections.push(ToolAssistance.createSection(mouseInstructions, ToolAssistance.inputsLabel));
    sections.push(ToolAssistance.createSection(touchInstructions, ToolAssistance.inputsLabel));

    const mainInstruction = ToolAssistance.createInstruction(this.iconSpec, mainMsg);
    const instructions = ToolAssistance.createInstructions(mainInstruction, sections);
    IVaultApp.notifications.setToolAssistance(instructions);
  }

  public override async updateElementData(ev: BeButtonEvent, isDynamics: boolean): Promise<void> {
    if (!isDynamics) {
      this._points.push(ev.point.clone());
    }

    const pts = isDynamics ? [...this._points, ev.point.clone()] : this._points;
    this._current = LineString3d.create(pts);
    if (isDynamics && !this._current && this._graphicsProvider) {
      this._graphicsProvider.cleanupGraphic(); // Don't continue displaying a prior successful result...
    }
  }

  protected override getPlacementProps(): PlacementProps | undefined {
    const vp = this.targetView;
    if (!vp || this._points.length < 1) {
      return undefined;
    }

    const origin = this._points[0];
    const angles = new YawPitchRollAngles();
    const matrix = AccuDrawHintBuilder.getCurrentRotation(vp, true, true);
    ElementGeometry.Builder.placementAnglesFromPoints(this._points, matrix?.getColumn(2), angles);
    return { origin, angles };
  }

  protected override getGeometryProps(placement: PlacementProps): FlatBufferGeometryStream | undefined {
    if (!this._current) {
      return undefined;
    }

    const builder = new ElementGeometry.Builder();
    builder.setLocalToWorldFromPlacement(placement);
    if (!builder.appendGeometryQuery(this._current)) {
      return undefined;
    }

    return { format: "flatbuffer", data: builder.entries };
  }

  protected override getElementProps(placement: PlacementProps): GeometricElementProps | undefined {
    return {
      classFullName: "Generic:PhysicalObject",
      model: this.targetModelId,
      category: this.targetCategory,
      code: Code.createEmpty(),
      placement,
    };
  }

  protected override isComplete(ev: BeButtonEvent): boolean {
    return ev.button === BeButton.Reset && this._points.length > 1;
  }

  protected override async doCreateElement(props: GeometricElementProps): Promise<void> {
    this._startedCmd = await this.startCommand();
    await basicManipulationIpc.insertGeometricElement(props);
    return basicManipulationIpc.saveChanges(this.flyover);
  }

  protected override async cancelPoint(ev: BeButtonEvent): Promise<boolean> {
    // NOTE: Starting another tool will not create element...require reset or closure...
    if (this.isComplete(ev)) {
      await this.updateElementData(ev, false);
      await this.createElement();
    }

    return true;
  }

  public override async onUndoPreviousStep(): Promise<boolean> {
    if (0 === this._points.length)
      return false;

    this._points.pop();
    if (0 === this._points.length) {
      await this.onReinitialize();
    } else {
      this.setupAndPromptForNextAction();
    }

    return true;
  }

  public async onRestartTool() {
    const tool = new PlaceLineStringTool();
    if (!await tool.run())
      return this.exitTool();
  }
}

/** Places a sphere defined by a center point and a radius point. Uses model and category
 * from [[BriefcaseConnection.editorToolSettings]]. */
export class PlaceSphereTool extends CreateElementWithDynamicsTool {
  public static override toolId = "PlaceSphere";
  public static override iconSpec = "icon-circle";
  private _center?: Point3d;
  private _radius?: number;
  private _startedCmd?: string;

  public override requireWriteableTarget(): boolean {
    // Inserting element will fail, but useful for testing AccuSnap and dynamics.
    return false;
  }

  protected async startCommand(): Promise<string> {
    if (undefined !== this._startedCmd)
      return this._startedCmd;
    return EditTools.startCommand<string>({ commandId: editorBuiltInCmdIds.cmdBasicManipulation, iVaultKey: this.iVault.key });
  }

  protected override setupAccuDraw(): void {
    if (undefined === this._center)
      return;

    const hints = new AccuDrawHintBuilder();
    hints.setOrigin(this._center);
    hints.sendHints();
  }

  protected override provideToolAssistance(_mainInstrText?: string, _additionalInstr?: ToolAssistanceInstruction[]): void {
    const mainMsg = ToolAssistance.translatePrompt(undefined === this._center ? "StartPoint" : "EndPoint");
    const leftMsg = ToolAssistance.translateInput("AcceptPoint");
    const rightMsg = ToolAssistance.translateInput("Cancel");

    const mouseInstructions: ToolAssistanceInstruction[] = [];
    const touchInstructions: ToolAssistanceInstruction[] = [];

    if (!ToolAssistance.createTouchCursorInstructions(touchInstructions))
      touchInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.OneTouchTap, leftMsg, false, ToolAssistanceInputMethod.Touch));
    mouseInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.LeftClick, leftMsg, false, ToolAssistanceInputMethod.Mouse));

    touchInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.TwoTouchTap, rightMsg, false, ToolAssistanceInputMethod.Touch));
    mouseInstructions.push(ToolAssistance.createInstruction(ToolAssistanceImage.RightClick, rightMsg, false, ToolAssistanceInputMethod.Mouse));

    const sections: ToolAssistanceSection[] = [];
    sections.push(ToolAssistance.createSection(mouseInstructions, ToolAssistance.inputsLabel));
    sections.push(ToolAssistance.createSection(touchInstructions, ToolAssistance.inputsLabel));

    const mainInstruction = ToolAssistance.createInstruction(this.iconSpec, mainMsg);
    const instructions = ToolAssistance.createInstructions(mainInstruction, sections);
    IVaultApp.notifications.setToolAssistance(instructions);
  }

  public override async updateElementData(ev: BeButtonEvent, isDynamics: boolean): Promise<void> {
    if (!isDynamics) {
      if (undefined === this._center) {
        this._center = ev.point.clone(); // first data point defines the sphere center...
      } else {
        this._radius = this._center.distance(ev.point); // second data point defines the radius...
      }
    } else if (undefined !== this._center) {
      this._radius = this._center.distance(ev.point);
    }

    if (isDynamics && undefined === this._center && this._graphicsProvider) {
      this._graphicsProvider.cleanupGraphic(); // Don't continue displaying a prior successful result...
    }
  }

  protected override getPlacementProps(): PlacementProps | undefined {
    if (undefined === this._center) {
      return undefined;
    }

    // A sphere is rotationally symmetric; identity orientation places it at the center point.
    return { origin: this._center, angles: new YawPitchRollAngles() };
  }

  protected override getGeometryProps(placement: PlacementProps): FlatBufferGeometryStream | undefined {
    if (undefined === this._center || undefined === this._radius || this._radius <= 0) {
      return undefined;
    }

    const builder = new ElementGeometry.Builder();
    builder.setLocalToWorldFromPlacement(placement);
    // Pass WORLD coordinates; appendGeometryQuery applies worldToLocal from the placement
    // (pre-localizing here would shift the sphere to the world origin)...
    if (!builder.appendGeometryQuery(Sphere.createCenterRadius(this._center, this._radius, undefined, true))) {
      return undefined;
    }

    return { format: "flatbuffer", data: builder.entries };
  }

  protected override getElementProps(placement: PlacementProps): GeometricElementProps | undefined {
    return {
      classFullName: "Generic:PhysicalObject",
      model: this.targetModelId,
      category: this.targetCategory,
      code: Code.createEmpty(),
      placement,
    };
  }

  protected override isComplete(_ev: BeButtonEvent): boolean {
    return undefined !== this._center && undefined !== this._radius && this._radius > 0;
  }

  protected override async doCreateElement(props: GeometricElementProps): Promise<void> {
    this._startedCmd = await this.startCommand();
    await basicManipulationIpc.insertGeometricElement(props);
    return basicManipulationIpc.saveChanges(this.flyover);
  }

  public async onRestartTool() {
    const tool = new PlaceSphereTool();
    if (!await tool.run())
      return this.exitTool();
  }
}

/** Moves the current selection (or interactively identified elements) by a translation
 * defined by two data points. Follows the sample from [[TransformElementsTool]]. */
export class MoveElementsTool extends TransformElementsTool {
  public static override toolId = "MoveElements";
  public static override iconSpec = "icon-move";

  protected override calculateTransform(ev: BeButtonEvent): Transform | undefined {
    return this.anchorPoint ? Transform.createTranslation(ev.point.minus(this.anchorPoint)) : undefined;
  }

  public override async onRestartTool(): Promise<void> {
    const tool = new MoveElementsTool();
    if (!await tool.run())
      return this.exitTool();
  }
}

/** Deletes elements interactively: after starting the tool, each element identified by a
 * data click is deleted immediately (hold Ctrl while clicking to accumulate multiple
 * elements first; drag-select is also supported). Reset exits the tool. */
export class DeleteElementsTool extends ElementSetTool {
  public static override toolId = "DeleteElements";
  public static override iconSpec = "icon-delete";
  private _startedCmd?: string;

  protected async startCommand(): Promise<string> {
    if (undefined !== this._startedCmd)
      return this._startedCmd;
    return EditTools.startCommand<string>({ commandId: editorBuiltInCmdIds.cmdBasicManipulation, iVaultKey: this.iVault.key });
  }

  protected override async processAgenda(_ev: BeButtonEvent): Promise<void> {
    this._startedCmd = await this.startCommand();
    await basicManipulationIpc.deleteElements(this.agenda.compressIds());
    return basicManipulationIpc.saveChanges("DeleteElements");
  }

  public override async onRestartTool(): Promise<void> {
    const tool = new DeleteElementsTool();
    if (!await tool.run())
      return this.exitTool();
  }
}

const toolNamespace = "szewTwinDesktopViewer";
let toolsRegistered = false;

/** Register the element editing tools with the ToolRegistry. Safe to call more than once. */
export function registerPlaceTools(): void {
  if (toolsRegistered) {
    return;
  }
  toolsRegistered = true;
  PlaceLineStringTool.register(toolNamespace);
  PlaceSphereTool.register(toolNamespace);
  MoveElementsTool.register(toolNamespace);
  DeleteElementsTool.register(toolNamespace);
}
