/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { useAccessToken } from "@szewtwin/desktop-viewer-react";
import type { Dispatch, SetStateAction } from "react";
import { createContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { SelectIVault } from "../modelSelector";
import { SignIn } from "../signin/SignIn";

interface IVaultsRouteState {
  szewTwinName?: string;
}

export interface IVaultContextOptions {
  pendingIVault?: string;
  setPendingIVault: Dispatch<SetStateAction<string | undefined>>;
}

export const IVaultContext = createContext({} as IVaultContextOptions);

export const IVaultsRoute = () => {
  const { szewTwinId } = useParams();
  const location = useLocation();
  const [szewTwinName, setSZEWTwinName] = useState<string>();
  const [pendingIVault, setPendingIVault] = useState<string>();
  const accessToken = useAccessToken();

  useEffect(() => {
    const routeState = location?.state as IVaultsRouteState | undefined;
    if (routeState?.szewTwinName) {
      setSZEWTwinName(routeState?.szewTwinName);
    }
  }, [location?.state]);

  return (
    <IVaultContext.Provider value={{ pendingIVault, setPendingIVault }}>
      {accessToken ? (
        <SelectIVault
          accessToken={accessToken}
          szewTwinId={szewTwinId}
          szewTwinName={szewTwinName}
        />
      ) : (
        <SignIn />
      )}
    </IVaultContext.Provider>
  );
};
