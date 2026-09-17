/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./SignIn.scss";

import { IVaultApp } from "@szewtwin/core-frontend";
import { SvgUser } from "@szewtwin/szewtwinui-icons-react";
import { Button } from "@szewtwin/szewtwinui-react";
import { useState } from "react";
import { isElectronRendererAuth } from "../../util/typeCheck";

export const SignIn = () => {
  const [signingIn, setSigningIn] = useState(false);

  const onSignInClick = async () => {
    setSigningIn(true);
    if (
      isElectronRendererAuth(IVaultApp.authorizationClient)
    ) {
      await IVaultApp.authorizationClient?.signIn();
    }
  };

  return (
    <div className="signin-container">
      <div className="signin">
        <SvgUser className="signin-user" />
        <Button
          className="signin-button"
          styleType="cta"
          disabled={signingIn}
          onClick={onSignInClick}
        >
          Sign In
        </Button>
        {signingIn && (
          <span>Please switch to your browser and enter your credentials</span>
        )}
      </div>
    </div>
  );
};
