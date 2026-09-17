/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { ColorTheme, UiFramework, UiItemsManager } from "@szewtwin/appui-react";
import { BeEvent } from "@szewtwin/core-szewec";
import { Cartographic, ColorDef } from "@szewtwin/core-common";
import { BlankConnection } from "@szewtwin/core-frontend";
import { Range3d } from "@szewtwin/core-geometry";
import * as unifiedSelection from "@szewtwin/unified-selection";
import { render, waitFor } from "@testing-library/react";
import React from "react";

import { IVaultViewer } from "../../../components/iVault/index.js";
import IVaultLoader from "../../../components/iVault/IVaultLoader.js";
import * as IVaultServices from "../../../services/iVault/IVaultService.js";
import type {
  BlankConnectionViewState,
  BlankViewerProps,
  ViewerFrontstage,
} from "../../../types.js";
import {
  TestUiProvider,
  TestUiProvider2,
} from "../../mocks/MockUiProviders.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-redux", async () => {
  const original = await vi.importActual<typeof import("react-redux")>(
    "react-redux"
  );

  return {
    ...original,
    Provider: vi.fn().mockImplementation(({ children }: any) => children),
  };
});

vi.mock("@szewtwin/appui-react", async (importActual) => {
  const original = await importActual<typeof import("@szewtwin/appui-react")>();

  const mockStore = {
    getState: vi.fn(),
    dispatch: vi.fn(),
    subscribe: vi.fn(),
    replaceReducer: vi.fn(),
  };

  return {
    ...original,
    StateManager: Object.create(original.StateManager, {
      store: {
        get: vi.fn(() => mockStore),
      },
    }),
    UiItemsManager: Object.create(original.UiItemsManager, {
      getBackstageItems: {
        value: vi.fn().mockReturnValue([]),
      },
    }),
  };
});

vi.mock("@szewtwin/appui-abstract");

vi.mock("@szewtwin/presentation-frontend", async (importActual) => {
  const original = await importActual<
    typeof import("@szewtwin/presentation-frontend")
  >();

  return {
    ...original,
    Presentation: {
      ...original.Presentation,
      initialize: vi.fn().mockImplementation(() => Promise.resolve()),
      registerInitializationHandler: vi
        .fn()
        .mockImplementation(() => Promise.resolve()),
      selection: {
        scopes: {
          getSelectionScopes: vi.fn(async () => []),
        },
      },
    },
  };
});

vi.mock("@szewtwin/core-frontend", async () => {
  const { BeEvent } = await import("@szewtwin/core-szewec"); // Needed here because mock is hoisted at the top before all imports.

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
        close: vi.fn(),
        selectionSet: {
          onChanged: new BeEvent<any>(),
          elements: new Set(),
        },
      } as any),
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

vi.mock("../../../services/iVault/IVaultService");

vi.mock("../../../components/iVault/IVaultViewer", () => ({
  __esModule: true,
  IVaultViewer: vi.fn(() => <div data-testid="viewer"></div>),
}));

vi.mock("@szewtwin/unified-selection", { spy: true });

vi.mocked(
  unifiedSelection.enableUnifiedSelectionSyncWithIVault
).mockImplementation(() => {
  return vi.fn();
});

const mockSZEWTwinId = "mockSZEWTwinId";
const mockIVaultId = "mockIVaultId";

describe("IVaultLoader", () => {
  beforeEach(() => {
    vi.spyOn(IVaultServices, "openRemoteIVault").mockResolvedValue({
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
      close: vi.fn(),
      isOpen: true,
      selectionSet: {
        onChanged: new BeEvent<any>(),
        elements: new Set(),
      },
    } as any);

    vi.spyOn(IVaultServices, "openLocalIVault").mockResolvedValue({
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
      close: vi.fn(),
      isOpen: true,
      selectionSet: {
        onChanged: new BeEvent<any>(),
        elements: new Set(),
      },
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("registers and unregisters ui providers", async () => {
    vi.spyOn(UiItemsManager, "register");
    vi.spyOn(UiItemsManager, "unregister");

    const result = render(
      <IVaultLoader
        szewTwinId={mockSZEWTwinId}
        iVaultId={mockIVaultId}
        uiProviders={[new TestUiProvider()]}
      />
    );

    await waitFor(() => result.getByTestId("loader-wrapper"));
    expect(UiItemsManager.register).toHaveBeenCalledTimes(1);

    result.rerender(
      <IVaultLoader
        szewTwinId={mockSZEWTwinId}
        iVaultId={mockIVaultId}
        uiProviders={[new TestUiProvider2()]}
      />
    );

    await waitFor(() => result.getByTestId("viewer"));
    expect(UiItemsManager.unregister).toHaveBeenCalledTimes(1);
  });

  it("creates a blank connection with szewTwinId passed in blankConnection", async () => {
    const blankConnectionProps = {
      location: Cartographic.fromDegrees({
        longitude: 0,
        latitude: 0,
        height: 0,
      }),
      extents: new Range3d(-30, -30, -30, 30, 30, 30),
      szewTwinId: mockSZEWTwinId,
    };

    const blankConnectionViewState: BlankConnectionViewState = {
      setAllow3dManipulations: true,
      displayStyle: {
        backgroundColor: ColorDef.blue,
      },
    };

    const { getByTestId } = render(
      <IVaultLoader
        {...blankConnectionProps}
        blankConnectionViewState={blankConnectionViewState}
      />
    );

    await waitFor(() => getByTestId("viewer"));
    expect(BlankConnection.create).toHaveBeenCalledWith({
      ...blankConnectionProps,
      name: "Blank Connection",
    });
  });

  it("creates a blank connection with szewTwinId passed separate from blankConnection", async () => {
    const blankConnectionProps: BlankViewerProps = {
      location: Cartographic.fromDegrees({
        longitude: 0,
        latitude: 0,
        height: 0,
      }),
      extents: new Range3d(-30, -30, -30, 30, 30, 30),
    };

    const blankConnectionViewState: BlankConnectionViewState = {
      setAllow3dManipulations: true,
      displayStyle: {
        backgroundColor: ColorDef.blue,
      },
    };

    const { getByTestId } = render(
      <IVaultLoader
        {...blankConnectionProps}
        blankConnectionViewState={blankConnectionViewState}
        szewTwinId={mockSZEWTwinId}
      />
    );

    await waitFor(() => getByTestId("viewer"));
    expect(BlankConnection.create).toHaveBeenCalledWith({
      ...blankConnectionProps,
      szewTwinId: mockSZEWTwinId,
      name: "Blank Connection",
    });
  });

  it("creates a remote connection from iVaultId and szewTwinId", async () => {
    const { getByTestId } = render(
      <IVaultLoader szewTwinId={mockSZEWTwinId} iVaultId={mockIVaultId} />
    );

    await waitFor(() => getByTestId("viewer"));
    expect(IVaultServices.openRemoteIVault).toHaveBeenCalledWith(
      mockSZEWTwinId,
      mockIVaultId,
      undefined // optional changesetId
    );
  });

  it("creates a local connection from filePath", async () => {
    const { getByTestId } = render(<IVaultLoader filePath="x://iVault" />);

    await waitFor(() => getByTestId("viewer"));
    expect(IVaultServices.openLocalIVault).toHaveBeenCalledWith(
      "x://iVault",
      undefined
    );
  });

  it("synchronizes with unified selection storage when storage provided", async () => {
    const connection = {
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
      close: vi.fn(),
      getRpcProps: vi.fn(),
      selectionSet: {
        onChanged: new BeEvent<any>(),
        elements: new Set(),
      },
    };

    vi.spyOn(IVaultServices, "openRemoteIVault").mockResolvedValue(
      connection as any
    );
    const result = render(
      <IVaultLoader szewTwinId={mockSZEWTwinId} iVaultId={mockIVaultId} selectionStorage={unifiedSelection.createStorage()}/>
    );
    await waitFor(() => result.getByTestId("viewer"));
    expect(
      unifiedSelection.enableUnifiedSelectionSyncWithIVault
    ).toHaveBeenCalled();
  });

  it("renders without a viewState if the default frontstage does not require a connection", async () => {
    const frontstages: ViewerFrontstage[] = [
      {
        default: true,
        provider: {} as any,
      },
    ];
    const result = render(
      <IVaultLoader
        szewTwinId={mockSZEWTwinId}
        iVaultId={mockIVaultId}
        frontstages={frontstages}
      />
    );
    await waitFor(() => result.getByTestId("viewer"));
    expect(IVaultViewer).toHaveBeenCalledWith(
      { backstageItems: undefined, frontstages },
      {}
    );
  });

  it("closes connection on unmount", async () => {
    const connection = {
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
      close: vi.fn(),
      selectionSet: {
        onChanged: new BeEvent<any>(),
        elements: new Set(),
      },
    };

    vi.spyOn(IVaultServices, "openRemoteIVault").mockResolvedValue(
      connection as any
    );

    const result = render(
      <IVaultLoader szewTwinId={mockSZEWTwinId} iVaultId={mockIVaultId} />
    );

    await waitFor(() => result.getByTestId("viewer"));
    expect(
      unifiedSelection.enableUnifiedSelectionSyncWithIVault
    ).not.toHaveBeenCalled();
    result.unmount();
    await waitFor(() => {
      expect(connection.close).toHaveBeenCalled();
    });
  });

  it("closes connection between model ids change", async () => {
    const connection = {
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
      close: vi.fn(),
      selectionSet: {
        onChanged: new BeEvent<any>(),
        elements: new Set(),
      },
    };

    vi.spyOn(IVaultServices, "openRemoteIVault").mockResolvedValue(
      connection as any
    );
    const result = render(
      <IVaultLoader szewTwinId={mockSZEWTwinId} iVaultId={mockIVaultId} />
    );

    await waitFor(() => result.getByTestId("viewer"));

    result.rerender(
      <IVaultLoader szewTwinId={mockSZEWTwinId} iVaultId={mockIVaultId + "1"} />
    );

    await waitFor(() => result.getByTestId("viewer"));

    await waitFor(() => {
      expect(connection.close).toHaveBeenCalled();
    });
  });

  it("closes connection between szewTwin ids change", async () => {
    const connection = {
      isBlankConnection: () => false,
      iVaultId: mockIVaultId,
      close: vi.fn(),
      selectionSet: {
        onChanged: new BeEvent<any>(),
        elements: new Set(),
      },
    };
    vi.spyOn(IVaultServices, "openRemoteIVault").mockResolvedValue(
      connection as any
    );
    const result = render(
      <IVaultLoader szewTwinId={mockSZEWTwinId} iVaultId={mockIVaultId} />
    );

    await waitFor(() => result.getByTestId("viewer"));

    result.rerender(
      <IVaultLoader szewTwinId={mockSZEWTwinId + "1"} iVaultId={mockIVaultId} />
    );

    await waitFor(() => result.getByTestId("viewer"));
    await waitFor(() => {
      expect(connection.close).toHaveBeenCalled();
    });
  });

  it("renders a custom loading component", async () => {
    vi.spyOn(IVaultServices, "openRemoteIVault").mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                isBlankConnection: () => false,
                iVaultId: mockIVaultId,
                close: vi.fn(),
                isOpen: true,
                selectionSet: {
                  onChanged: new BeEvent<any>(),
                  elements: new Set(),
                },
              } as any),
            500
          )
        )
    );

    const Loader = () => {
      return <div>Things are happening</div>;
    };
    const result = render(
      <IVaultLoader
        szewTwinId={mockSZEWTwinId}
        iVaultId={mockIVaultId}
        loadingComponent={<Loader />}
      />
    );

    const loadingComponent = await waitFor(() =>
      result.getByText("Things are happening")
    );

    expect(loadingComponent).toBeInTheDocument();
  });
});
