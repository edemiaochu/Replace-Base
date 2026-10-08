/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BrowserAuthorizationClient } from "@szewtwin/browser-authorization";
import { Cartographic, ColorDef, RenderMode } from "@szewtwin/core-common";
import { IVaultApp } from "@szewtwin/core-frontend";
import { Range3d } from "@szewtwin/core-geometry";
import { SZEWTwinLocalization } from "@szewtwin/core-i18n";
import { RealityDataAccessClient } from "@szewtwin/reality-data-client";
import { Viewer } from "@szewtwin/web-viewer-react";
import { useCallback, useEffect, useMemo } from "react";

import { GeometryDecorator } from "../../decorators/GeometryDecorator";
import { TestUiProvider2 } from "../../providers";

/**
 * Test blank connection viewer
 * @returns
 */
const BlankConnectionHome: React.FC = () => {
  const localization = useMemo(() => new SZEWTwinLocalization(), []);
  const authClient = useMemo(
    () =>
      new BrowserAuthorizationClient({
        scope: import.meta.env.IVJS_AUTH_CLIENT_SCOPES ?? "",
        clientId: import.meta.env.IVJS_AUTH_CLIENT_CLIENT_ID ?? "",
        redirectUri: import.meta.env.IVJS_AUTH_CLIENT_REDIRECT_URI ?? "",
        postSignoutRedirectUri: import.meta.env.IVJS_AUTH_CLIENT_LOGOUT_URI,
        responseType: "code",
      }),
    []
  );

  const realityDataAccessClient = useMemo(
    () =>
      new RealityDataAccessClient({
        baseUrl: `https://${globalThis.IVJS_URL_PREFIX}api.szewec.com/realitydata`,
        authorizationClient: authClient,
      }),
    [authClient]
  );

  const login = useCallback(async () => {
    try {
      await authClient.signInSilent();
    } catch {
      await authClient.signIn();
    }
  }, [authClient]);

  useEffect(() => {
    void login();
  }, [login]);

  /**
   * This value is for the szewTwin Viewer and will be the default if the productId prop is not provided.
   * This is merely an example on how to use the prop to override with your application's GPRID.
   */
  const productId = "3098";

  const iVaultAppInit = () => {
    const decorator = new GeometryDecorator();
    IVaultApp.viewManager.addDecorator(decorator);
    decorator.drawBase();
  };

  return (
    <div style={{ height: "100vh" }}>
      <Viewer
        authClient={authClient}
        productId={productId}
        onIVaultAppInit={iVaultAppInit}
        uiProviders={[new TestUiProvider2()]}
        enablePerformanceMonitors={true}
        location={Cartographic.fromDegrees({
          longitude: 0,
          latitude: 0,
          height: 0,
        })}
        blankConnectionViewState={{
          displayStyle: { backgroundColor: ColorDef.white },
          viewFlags: { grid: true, renderMode: RenderMode.SmoothShade },
          setAllow3dManipulations: false,
        }}
        extents={new Range3d(-30, -30, -30, 30, 30, 30)}
        localization={localization}
        realityDataAccess={realityDataAccessClient}
      />
    </div>
  );
};

export default BlankConnectionHome;
