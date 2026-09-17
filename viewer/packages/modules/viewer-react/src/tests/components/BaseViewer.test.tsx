/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { UiCore } from '@szewtwin/core-react';
import { BaseViewer } from "../../components/BaseViewer.js";
import * as IVaultService from "../../services/iVault/IVaultService.js";

vi.mock("@szewtwin/presentation-frontend", async (importActual) => {
  const original = await importActual<typeof import("@szewtwin/presentation-frontend")>();

  return {
    ...original,
    Presentation: {
      ...original.Presentation,
      initialize: vi.fn().mockImplementation(() => Promise.resolve()),
      registerInitializationHandler: vi.fn().mockImplementation(() => Promise.resolve()),
      selection: {
        scopes: {
          getSelectionScopes: vi.fn(async () => []),
        },
      },
    },
  };
});

vi.mock("@szewtwin/core-frontend", async (importActual) => {
  const original = await importActual<typeof import("@szewtwin/core-frontend")>();

  return {
    ...original,
    IVaultApp: {
      initialized: true,
      startup: vi.fn(),
      telemetry: {
        addClient: vi.fn(),
      },
      localization: {
        registerNamespace: vi.fn().mockResolvedValue(true),
        getLanguageList: vi.fn().mockReturnValue(["en-US"]),
        getLocalizedString: vi.fn(),
        unregisterNamespace: vi.fn(),
        translateWithNamespace: vi.fn(),
      },
      uiAdmin: {
        updateFeatureFlags: vi.fn(),
      },
      authorizationClient: {
        onAccessTokenChanged: {
          addListener: vi.fn(),
        },
      },
      viewManager: {
        onViewOpen: {
          addOnce: vi.fn(),
        },
      },
      shutdown: vi.fn().mockImplementation(() => Promise.resolve()),
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
    ItemField: {},
    CompassMode: {},
    RotationMode: {},
    AccuDraw: class { },
    ToolAdmin: class { },
    BriefcaseConnection: {
      openFile: vi.fn(),
    },
  }
});

vi.mock("../../services/iVault/IVaultService");
vi.mock("@szewtwin/appui-react", async (importActual) => {
  const original = await importActual<typeof import("@szewtwin/appui-react")>();

  return {
    ...original,
    UiFramework: {
      ...original.UiFramework,
      initialize: vi.fn().mockImplementation(() => Promise.resolve()),
    },
    UiItemsManager: {
      ...original.UiItemsManager,
      getBackstageItems: vi.fn().mockReturnValue([]),
    },
  };
});

vi.mock("../../hooks/useAccessToken", () => {
  return { useAccessToken: () => "mockToken" };
});

vi.mock("../../services/BaseInitializer", () => {
  return {
    BaseInitializer: {
      authClient: {
        hasSignedIn: true,
        isAuthorized: true,
        onAccessTokenChanged: {
          addListener: vi.fn(),
        },
      },
      initialize: vi.fn().mockResolvedValue(true),
      cancel: vi.fn(),
      shutdown: vi.fn(),
      initialized: Promise.resolve(),
    },
  };
});

const mockSZEWTwinId = "123";
const mockIVaultId = "456";

describe("BaseViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (UiCore.initialized) { // eslint-disable-line @typescript-eslint/no-deprecated
      UiCore.terminate(); // eslint-disable-line @typescript-eslint/no-deprecated
    }
  });

  it("loads the model loader for the specified szewTwinId and iVaultId", async () => {
    const { getByTestId } = render(
      <BaseViewer
        szewTwinId={mockSZEWTwinId}
        iVaultId={mockIVaultId}
        enablePerformanceMonitors={false}
      />
    );

    const viewerContainer = await waitFor(() => getByTestId("loader-wrapper"));

    expect(viewerContainer).toBeInTheDocument();;
  });

  it("queries the iVault with the provided changeSetId", async () => {
    const { getByTestId } = render(
      <BaseViewer
        szewTwinId={mockSZEWTwinId}
        iVaultId={mockIVaultId}
        productId={"0000"}
        changeSetId={"123"}
        enablePerformanceMonitors={false}
      />
    );

    await waitFor(() => getByTestId("loader-wrapper"));

    expect(IVaultService.openRemoteIVault).toHaveBeenCalledWith(
      mockSZEWTwinId,
      mockIVaultId,
      "123"
    );
  });

  it("renders and attempts to create a briefcase connection or snapshot connection if a local path is provided", async () => {
    const fileName = "/path/to/snapshot";

    const { getByTestId } = render(
      <BaseViewer filePath={fileName} enablePerformanceMonitors={false} />
    );

    const loader = await waitFor(() => getByTestId("loader-wrapper"));

    expect(loader).toBeInTheDocument();
    expect(IVaultService.openLocalIVault).toHaveBeenCalledWith(
      fileName,
      undefined
    );
  });

  it("renders and attempts to create a briefcase connection in write mode", async () => {
    const fileName = "/path/to/snapshot";

    const { getByTestId } = render(
      <BaseViewer
        filePath={fileName}
        readonly={false}
        enablePerformanceMonitors={false}
      />
    );

    const loader = await waitFor(() => getByTestId("loader-wrapper"));

    expect(loader).toBeInTheDocument();
    expect(IVaultService.openLocalIVault).toHaveBeenCalledWith(fileName, false);
  });
});