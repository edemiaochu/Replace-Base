/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import type { IVaultRpcProps } from "@szewtwin/core-common";
import {
  IVaultReadRpcInterface,
  IVaultTileRpcInterface,
  RpcInterface,
  RpcManager,
} from "@szewtwin/core-common";
import { DMSchemaRpcInterface } from "@szewtwin/dmschema-rpcinterface-common";
import { PresentationRpcInterface } from "@szewtwin/presentation-common";

export const defaultRpcInterfaces = [
  IVaultReadRpcInterface,
  IVaultTileRpcInterface,
  PresentationRpcInterface,
  DMSchemaRpcInterface
];

export abstract class TestRpcInterface extends RpcInterface {
  public static readonly interfaceName = "TestRpcInterface";
  public static interfaceVersion = "1.1.1";

  public static getClient(): TestRpcInterface {
    return RpcManager.getClientForInterface(TestRpcInterface);
  }
  public async restartIVaultHost(): Promise<void> {
    return this.forward(arguments);
  }
  public async executeTest(
    _iVaultRpcProps: IVaultRpcProps,
    _testName: string,
    _params: any
  ): Promise<any> {
    return this.forward(arguments);
  }
  public async purgeCheckpoints(_iVaultId: string): Promise<void> {
    return this.forward(arguments);
  }
  public async purgeStorageCache(): Promise<void> {
    return this.forward(arguments);
  }
  public async beginOfflineScope(): Promise<void> {
    return this.forward(arguments);
  }
  public async endOfflineScope(): Promise<void> {
    return this.forward(arguments);
  }
}

export class TestRpcInterface2 extends TestRpcInterface {
  public static override readonly interfaceName = "TestRpcInterface";
  public static override interfaceVersion = "1.1.1";
  public static override getClient(): TestRpcInterface2 {
    return RpcManager.getClientForInterface(TestRpcInterface2);
  }
}
