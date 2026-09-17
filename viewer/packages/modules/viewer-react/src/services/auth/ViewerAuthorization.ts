/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { AccessToken, BeEvent } from "@szewtwin/core-szewec";
import type { AuthorizationClient } from "@szewtwin/core-common";

export interface ViewerAuthorizationClient extends AuthorizationClient {
  readonly onAccessTokenChanged: BeEvent<(token: AccessToken) => void>;
}

export class ViewerAuthorization {
  public static client?: ViewerAuthorizationClient;
}
