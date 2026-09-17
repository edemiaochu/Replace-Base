/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { RpcInterface, RpcInterfaceDefinition } from "@szewtwin/core-common";
import type {
  BlankViewerProps,
  ConnectedViewerProps,
  FileViewerProps,
  ViewerCommonProps,
  XOR,
} from "@szewtwin/viewer-react";

export type DesktopInitializerParams = ViewerCommonProps & {
  rpcInterfaces?: RpcInterfaceDefinition<RpcInterface>[];
  clientId?: string;
};

type ClientIdProps =
  | {
      clientId: string;
      szewTwinId: string;
    }
  | {
      clientId?: string;
      szewTwinId?: never;
    };

type ConnectedViewerDesktopProps = ConnectedViewerProps &
  Required<Pick<DesktopInitializerParams, "clientId">>;
type BlankViewerDesktopProps = BlankViewerProps & ClientIdProps;
type FileViewerDesktopProps = FileViewerProps &
  Pick<DesktopInitializerParams, "clientId">;

/** Desktop Viewer can open local (snapshot/briefcase), connected or blank connection models */
export type DesktopViewerProps = DesktopInitializerParams &
  XOR<
    XOR<FileViewerDesktopProps, BlankViewerDesktopProps>,
    ConnectedViewerDesktopProps
  >;

// todo: rm enum in favor of as const
export enum ModelStatus {
  ONLINE,
  OUTDATED,
  DOWNLOADING,
  MERGING,
  ERROR,
  UPTODATE,
  SNAPSHOT,
  COMPARING,
}

export interface ProgressInfo {
  percent?: number;
  total?: number;
  loaded: number;
}
