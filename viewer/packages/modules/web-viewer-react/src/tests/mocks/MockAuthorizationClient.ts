/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import type { AccessToken } from "@szewtwin/core-szewec";
import { BeEvent } from "@szewtwin/core-szewec";
import type { ViewerAuthorizationClient } from "@szewtwin/viewer-react";

class MockAuthorizationClient implements ViewerAuthorizationClient {
  getAccessToken(): Promise<string> {
    return Promise.resolve("Bearer token");
  }

  readonly onAccessTokenChanged = new BeEvent<(token: AccessToken) => void>();
}

export default MockAuthorizationClient;
