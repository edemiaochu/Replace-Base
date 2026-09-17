/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { ElectronApp } from "@szewtwin/core-electron/lib/cjs/ElectronFrontend.js";
import { IVaultApp, NativeAppLogger } from "@szewtwin/core-frontend";
import { ElectronRendererAuthorization } from "@szewtwin/electron-authorization/Renderer";
import {
  getIVaultAppOptions,
  makeCancellable,
  ViewerAuthorization,
  ViewerPerformance,
} from "@szewtwin/viewer-react";

import type { DesktopInitializerParams } from "../types.js";

export class DesktopInitializer {
  private static _initialized: Promise<void>;
  private static _initializing = false;
  private static _cancel: (() => void) | undefined;

  /** expose initialized promise */
  public static get initialized(): Promise<void> {
    return this._initialized;
  }

  /** expose initialized cancel method */
  public static cancel: () => void = () => {
    if (DesktopInitializer._initializing) {
      if (DesktopInitializer._cancel) {
        DesktopInitializer._cancel();
      }
      ElectronApp.shutdown().catch(() => {
        // Do nothing, its possible that we never started.
      });
      ViewerPerformance.clear();
    }
  };

  /** Desktop viewer startup */
  public static async startDesktopViewer(options: DesktopInitializerParams) {
    if (!IVaultApp.initialized && !this._initializing) {
      console.log("starting desktop viewer");
      this._initializing = true;

      const cancellable = makeCancellable(function* () {
        ViewerPerformance.enable(options?.enablePerformanceMonitors);
        ViewerPerformance.addMark("ViewerStarting");

        const iVaultAppOpts = getIVaultAppOptions(options);

        const authClient = new ElectronRendererAuthorization({
          clientId: options.clientId ?? "",
        });
        iVaultAppOpts.authorizationClient = authClient;
        ViewerAuthorization.client = authClient;

        iVaultAppOpts.rpcInterfaces = options?.rpcInterfaces; // eslint-disable-line @typescript-eslint/no-deprecated

        yield ElectronApp.startup({
          iVaultApp: iVaultAppOpts,
        });
        // register extensions after startup
        if (options?.extensions) {
          options.extensions.forEach((extension) => {
            if (extension.hostname) {
              IVaultApp.extensionAdmin.registerHost(
                `https://${extension.hostname}`
              );
            }
            IVaultApp.extensionAdmin
              .addExtension(extension)
              .catch((e) => console.log(e));
          });
        }
        NativeAppLogger.initialize();
        ViewerPerformance.addMark("ViewerStarted");
        ViewerPerformance.addMeasure(
          "ViewerInitialized",
          "ViewerStarting",
          "ViewerStarted"
        );
        console.log("desktop viewer started");
      });

      DesktopInitializer._cancel = cancellable.cancel;
      this._initialized = cancellable.promise
        .catch((err) => {
          if (err.reason !== "cancelled") {
            throw err;
          }
        })
        .finally(() => {
          DesktopInitializer._initializing = false;
          DesktopInitializer._cancel = undefined;
        });
    } else {
      this._initialized = Promise.resolve();
    }
  }
}
