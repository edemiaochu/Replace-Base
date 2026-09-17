/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useAccessToken } from "@szewtwin/desktop-viewer-react";

import { SelectSZEWTwin } from "../modelSelector";
import { SignIn } from "../signin/SignIn";

export const SZEWTwinsRoute = () => {
  const accessToken = useAccessToken();

  if (accessToken) {
    return <SelectSZEWTwin />;
  } else {
    return <SignIn />;
  }
};
