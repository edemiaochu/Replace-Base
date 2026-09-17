/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { UiFramework } from "@szewtwin/appui-react";
import type { IVaultConnection } from "@szewtwin/core-frontend";

import { DefaultContentGroupProvider } from "../../../../components/app-ui/providers/index.js";
import { ViewCreator3d } from "../../../../services/iVault/index.js";
import { createBlankViewState } from "../../../../services/iVault/index.js";
import type { ViewerViewportControlOptions } from "../../../../types.js";
import { afterEach, describe, expect, it, vi } from "vitest";

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
      create: vi.fn().mockReturnValue({
        isBlankConnection: () => true,
        isOpen: true,
      } as any),
    },
    ItemField: {},
    CompassMode: {},
    RotationMode: {},
    AccuDraw: class {},
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

vi.mock("../../../../services/iVault/ViewCreatorBlank", () => {
  return {
    createBlankViewState: vi.fn().mockResolvedValue({}),
  };
});

vi.mock("../../../../services/iVault/ViewCreator3d", () => {
  return {
    ViewCreator3d: vi.fn().mockImplementation(() => {
      return {
        createDefaultView: vi.fn().mockResolvedValue({}),
      };
    }),
  };
});

vi.mock("@szewtwin/appui-react");

const mockIVaultId = "mockIVaultId";

describe("DefaultContentGroupProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  it("generates a default viewstate for a connection", async () => {
    vi.spyOn(UiFramework, "getIVaultConnection").mockReturnValue({
      isBlankConnection: () => false,
    } as any);

    const contentGroupProvider = new DefaultContentGroupProvider();
    await contentGroupProvider.contentGroup();
    expect(ViewCreator3d).toHaveBeenCalled();
  });

  it("generates a blank viewstate for a blank connection", async () => {
    vi.spyOn(UiFramework, "getIVaultConnection").mockReturnValue({
      isBlankConnection: () => true,
    } as any);

    const contentGroupProvider = new DefaultContentGroupProvider();
    await contentGroupProvider.contentGroup();
    expect(createBlankViewState).toHaveBeenCalled();
  });

  it("uses the provided viewstate when connection ivaultid matches viewstate ivaultid", async () => {
    vi.spyOn(UiFramework, "getIVaultConnection").mockReturnValue({
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
    } as any);

    const viewportOptions: ViewerViewportControlOptions = {
      viewState: {
        iVault: {
          iVaultId: mockIVaultId,
        },
      } as any,
    };
    const contentGroupProvider = new DefaultContentGroupProvider(
      viewportOptions
    );
    await contentGroupProvider.contentGroup();
    expect(ViewCreator3d).not.toHaveBeenCalled();
  });

  it("gets the viewstate from the provided function", async () => {
    vi.spyOn(UiFramework, "getIVaultConnection").mockReturnValue({
      isBlankConnection: () => false,
    } as any);

    const mocks = {
      viewState: (connection: IVaultConnection) =>
        ({
          iVault: connection,
        } as any),
    };
    vi.spyOn(mocks, "viewState");
    const viewportOptions: ViewerViewportControlOptions = {
      viewState: mocks.viewState,
    };
    const contentGroupProvider = new DefaultContentGroupProvider(
      viewportOptions
    );
    await contentGroupProvider.contentGroup();
    expect(mocks.viewState).toHaveBeenCalled();
  });

  it("will not generate a default viewState when alwaysUseSuppliedViewState is true", async () => {
    vi.spyOn(UiFramework, "getIVaultConnection").mockReturnValue({
      isBlankConnection: () => false,
    } as any);

    const viewportOptions: ViewerViewportControlOptions = {
      alwaysUseSuppliedViewState: true,
    };
    const contentGroupProvider = new DefaultContentGroupProvider(
      viewportOptions
    );
    await contentGroupProvider.contentGroup();
    expect(ViewCreator3d).not.toHaveBeenCalled();
  });

  it("generates a default viewstate alwaysUseSuppliedViewState is false and no viewstate is provided", async () => {
    vi.spyOn(UiFramework, "getIVaultConnection").mockReturnValue({
      isBlankConnection: () => false,
    } as any);

    const viewportOptions: ViewerViewportControlOptions = {
      alwaysUseSuppliedViewState: false,
    };
    const contentGroupProvider = new DefaultContentGroupProvider(
      viewportOptions
    );
    await contentGroupProvider.contentGroup();
    expect(ViewCreator3d).toHaveBeenCalled();
  });

  it("generates a default viewstate when connection ivaultid does not match viewstate ivaultid", async () => {
    vi.spyOn(UiFramework, "getIVaultConnection").mockReturnValue({
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
      isOpen: true,
    } as any);

    const viewportOptions: ViewerViewportControlOptions = {
      viewState: {
        iVault: {
          iVaultId: `${mockIVaultId}2`,
        },
      } as any,
    };
    const contentGroupProvider = new DefaultContentGroupProvider(
      viewportOptions
    );
    await contentGroupProvider.contentGroup();
    expect(ViewCreator3d).toHaveBeenCalled();
  });
});
