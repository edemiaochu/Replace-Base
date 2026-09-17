/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { IVaultApp } from "@szewtwin/core-frontend";
import {
  getIVaultAppOptions,
  makeCancellable,
  ViewerAuthorization,
  ViewerPerformance,
} from "@szewtwin/viewer-react";

import type { WebInitializerParams } from "../types.js";
import { RpcInitializer } from "./RpcInitializer.js";

export class WebInitializer {
  private static _initialized: Promise<void>;
  private static _initializing = false;
  private static _cancel: (() => void) | undefined;

  /** expose initialized promise */
  public static get initialized(): Promise<void> {
    return this._initialized;
  }

  /** expose initialized cancel method */
  public static cancel: () => void = () => {
    if (WebInitializer._initializing) {
      WebInitializer._cancel?.();
      IVaultApp.shutdown().catch(() => {
        // Do nothing, its possible that we never started.
      });
      ViewerPerformance.clear();
    }
  };

  /** Web viewer startup */
  public static async startWebViewer(options: WebInitializerParams) {
    if (!IVaultApp.initialized && !this._initializing) {
      console.log("starting web viewer");
      this._initializing = true;

      const {
        backendConfiguration,
        authClient,
        extensions,
        ...optionsForIVaultApp
      } = options;

      const enablePerformanceMonitors = options.enablePerformanceMonitors;
      const iVaultAppOptions = getIVaultAppOptions(optionsForIVaultApp);

      const cancellable = makeCancellable(function* () {
        ViewerPerformance.enable(enablePerformanceMonitors);
        ViewerPerformance.addMark("ViewerStarting");

        iVaultAppOptions.authorizationClient = authClient;
        ViewerAuthorization.client = authClient;

        yield IVaultApp.startup(iVaultAppOptions);

        // register extensions after startup
        if (extensions) {
          extensions.forEach((extension) => {
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

        const rpcInitializer = new RpcInitializer();
        rpcInitializer.registerClients(backendConfiguration);

        ViewerPerformance.addMark("ViewerStarted");
        ViewerPerformance.addMeasure(
          "ViewerInitialized",
          "ViewerStarting",
          "ViewerStarted"
        );
      });

      WebInitializer._cancel = cancellable.cancel;
      this._initialized = cancellable.promise
        .catch((err) => {
          if (err.reason !== "cancelled") {
            throw err;
          }
        })
        .finally(() => {
          WebInitializer._initializing = false;
          WebInitializer._cancel = undefined;
        });
    }
  }
}
