/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { RequireAtLeastOne } from "@szewtwin/core-szewec";
import type {
  SzewecCloudRpcParams,
  RpcInterface,
  RpcInterfaceDefinition,
} from "@szewtwin/core-common";
import type {
  BlankViewerProps,
  ConnectedViewerProps,
  ViewerAuthorizationClient,
  ViewerCommonProps,
  XOR,
} from "@szewtwin/viewer-react";

export type WebInitializerParams = ViewerCommonProps & {
  /** authorization configuration */
  backendConfiguration?: BackendConfiguration;
  authClient?: ViewerAuthorizationClient;
};

type AuthClientProps =
  | {
      authClient: ViewerAuthorizationClient;
      szewTwinId: string;
    }
  | {
      authClient?: ViewerAuthorizationClient;
      szewTwinId?: never;
    };

type ConnectedViewerWebProps = ConnectedViewerProps &
  Required<Pick<WebInitializerParams, "authClient">>;
type BlankViewerWebProps = BlankViewerProps & AuthClientProps;

export type WebViewerProps = XOR<ConnectedViewerWebProps, BlankViewerWebProps> &
  WebInitializerParams;

/**
 * Custom backend and rpc configuration
 */
export type BackendConfiguration = {
  defaultBackend?: RequireAtLeastOne<
    Omit<Backend, "config"> & {
      config: RequireAtLeastOne<SzewecCloudRpcParams>;
    }
  >;
  customBackends?: Backend[];
};

type Backend = {
  rpcInterfaces: RpcInterfaceDefinition<RpcInterface>[];
  config: SzewecCloudRpcParams;
};
