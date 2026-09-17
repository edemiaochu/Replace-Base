import { BeEvent } from "@szewtwin/core-szewec";
import { ElectronRendererAuthorization } from "@szewtwin/electron-authorization/Renderer";

export const isElectronRendererAuth = (client: any): client is ElectronRendererAuthorization => {
  return client?.onAccessTokenChanged instanceof BeEvent &&
    typeof client?.signIn === "function" &&
    typeof client?.signOut === "function" &&
    typeof client?.signInSilent === "function" &&
    typeof client?.getAccessToken === "function";
};