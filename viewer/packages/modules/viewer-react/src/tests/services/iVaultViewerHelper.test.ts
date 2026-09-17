/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Cartographic } from "@szewtwin/core-common";
import type { BlankConnectionProps } from "@szewtwin/core-frontend";
import { BlankConnection } from "@szewtwin/core-frontend";
import { Range3d } from "@szewtwin/core-geometry";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as iVaultService from "../../services/iVault/IVaultService.js";
import {
  createBlankConnection,
  gatherRequiredViewerProps,
  openConnection,
} from "../../services/iVault/iVaultViewerHelper.js";

vi.mock("@szewtwin/core-frontend", () => {
  return {
    IVaultApp: {
      startup: vi.fn(),
      telemetry: {
        addClient: vi.fn(),
      },
      localization: {
        getLocalizedString: vi.fn(),
        registerNamespace: vi.fn().mockResolvedValue(true),
      },
      uiAdmin: {
        updateFeatureFlags: vi.fn(),
      },
      notifications: {
        openMessageBox: vi.fn(),
      },
      viewManager: {
        onSelectionSetChanged: vi.fn(),
        onViewOpen: {
          addOnce: vi.fn(),
        },
      },
    },
    SnapMode: {},
    ActivityMessageDetails: vi.fn(),
    PrimitiveTool: vi.fn(),
    NotificationManager: vi.fn(),
    Tool: vi.fn(),
    RemoteBriefcaseConnection: {
      open: vi.fn(),
    },
    SnapshotConnection: {
      openFile: vi.fn(),
    },
    MessageBoxType: {
      Ok: 1,
    },
    MessageBoxIconType: {
      Critical: 1,
    },
    BlankConnection: {
      create: vi.fn().mockImplementation((params) => ({
        isBlankConnection: () => true,
        isOpen: true,
        ...params,
      })),
    },
    ItemField: {},
    CompassMode: {},
    RotationMode: {},
    AccuDraw: class {},
    AccuSnap: class {},
    ToolAdmin: class {},
    WebViewerApp: {
      startup: vi.fn().mockResolvedValue(true),
    },
    ViewCreator3d: vi.fn().mockImplementation(() => {
      return {
        createDefaultView: vi.fn().mockResolvedValue({}),
      };
    }),
    SpatialViewState: {
      className: "",
    },
    DrawingViewState: {
      className: "",
    },
    SheetViewState: {
      className: "",
    },
  };
});

describe("iVaultViewerHelper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createBlankConnection() with separate szewTwinId", async () => {
    const mockSZEWTwinId = "mockSZEWTwinId";
    const blankConnectionProps: BlankConnectionProps = {
      name: "Blank Connection",
      extents: new Range3d(10, 10, 10),
      location: Cartographic.createZero(),
    };
    const blankConnection = createBlankConnection({
      szewTwinId: mockSZEWTwinId,
      blankConnectionProps,
    });

    expect(blankConnection.szewTwinId).toEqual(mockSZEWTwinId);
  });

  it("createBlankConnection() with szewTwinId passed in connection props", () => {
    const mockSZEWTwinId = "mockSZEWTwinId";
    const blankConnectionProps: BlankConnectionProps = {
      name: "Blank Connection",
      extents: new Range3d(10, 10, 10),
      location: Cartographic.createZero(),
      szewTwinId: mockSZEWTwinId,
    };
    const blankConnection = createBlankConnection({
      szewTwinId: mockSZEWTwinId,
      blankConnectionProps,
    });

    expect(blankConnection.szewTwinId).toEqual(mockSZEWTwinId);
  });

  it("openConnection() opens a connection type depending on parameters", async () => {
    const openRemoteSpy = vi
      .spyOn(iVaultService, "openRemoteIVault")
      .mockResolvedValueOnce(undefined);

    await openConnection({
      szewTwinId: "szewTwinId",
      iVaultId: "iVaultId",
    });

    expect(openRemoteSpy).toHaveBeenCalledTimes(1);

    const openLocalSpy = vi
      .spyOn(iVaultService, "openLocalIVault")
      .mockResolvedValueOnce({} as any);

    await openConnection({
      filePath: "x:/my/ivault",
    });

    expect(openLocalSpy).toHaveBeenCalledTimes(1);

    await openConnection({
      extents: new Range3d(10, 10, 10),
      location: Cartographic.createZero(),
      szewTwinId: "szewTwinId",
    });

    expect(BlankConnection.create).toHaveBeenCalledTimes(1);
  });

  it("gatherRequiredViewerProps narrows required viewer properties", async () => {
    const validConnectedProps = { szewTwinId: "szewTwinId", iVaultId: "iVaultId" };
    const validBlankConnectionProps = {
      extents: new Range3d(10, 10, 10),
      location: Cartographic.createZero(),
      szewTwinId: "mockSZEWTwinId",
    };
    const validLocalConnectionProps = { filePath: "x:\\ivault" };

    expect(gatherRequiredViewerProps(validConnectedProps)).toEqual(
      validConnectedProps
    );
    expect(gatherRequiredViewerProps(validBlankConnectionProps)).toEqual(
      validBlankConnectionProps
    );
    expect(gatherRequiredViewerProps(validLocalConnectionProps)).toEqual(
      validLocalConnectionProps
    );
    expect(gatherRequiredViewerProps({})).toBeUndefined();
    expect(
      gatherRequiredViewerProps({ szewTwinId: "mockSZEWtwinId" })
    ).toBeUndefined();
    expect(gatherRequiredViewerProps({ iVaultId: "iVaultId" })).toBeUndefined();
  });
});
