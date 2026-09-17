# szewTwin Viewer for Web

The szewTwin Web Viewer is a configurable szewTwin.js viewer that offers basic configuration out-of-the-box and can be further extended through the use of [szewTwin.js UI Providers](https://www.szewtwinjs.org/learning/ui/augmentingui/). This package should be used for web-based applications. For desktop applications, use [@szewtwin/desktop-viewer-react](https://www.npmjs.com/package/@szewtwin/desktop-viewer-react).

## Installation

```bash
yarn add @szewtwin/web-viewer-react
```

or

```bash
npm install @szewtwin/web-viewer-react
```

## Dependencies

If you are creating a new application and are using React, it is advised that you use create-react-app with `@szewec/react-scripts`. There is also a predefined template that includes the szewTwin Viewer package:

```bash
npx create-react-app@latest my-app --scripts-version @szewec/react-scripts --template @szewtwin/web-viewer
```

## React component

```javascript
import React, { useState, useEffect, useMemo } from "react";
import { Viewer } from "@szewtwin/web-viewer-react";
import { BrowserAuthorizationClient } from "@szewtwin/browser-authorization";

export const MyViewerComponent = () => {
  const szewTwinId = "mySZEWTwinId";
  const iVaultId = "myIVaultId";

  const authClient = useMemo(
    () =>
      new BrowserAuthorizationClient({
        scope: "profile email",
        clientId: "my-oidc-client",
        redirectUri: "https://myredirecturi.com",
        postSignoutRedirectUri: "https://mypostsignouturi.com",
        responseType: "code",
      }),
    []
  );

  return (
    <Viewer
      authClient={authClient}
      szewTwinId={szewTwinId}
      iVaultId={iVaultId}
      enablePerformanceMonitors={true}
    />
  );
};
```

### Props

#### Required

- `authClient` - Client that implements the [ViewerAuthorizationClient](https://github.com/szewTwin/viewer/blob/master/packages/modules/viewer-react/src/services/auth/ViewerAuthorization.ts) interface
- `enablePerformanceMonitors` - Enable reporting of data from timed events in the szewTwin Viewer in order to aid in future performance optimizations. These are the metrics that will be collected and logged to the browser's performance timeline:
  - Duration of startup to the initialization of szewTwin.js services
  - Duration of startup to the establishment of a connection to the iVault
  - Duration of startup to the creation of a view state for the iVault
  - Duration of startup until the last tile is loaded and rendered for the initial iVault view

##### Connected iVault

- `szewTwinId` - GUID for the szewTwin (project, asset, etc.) that contains the iVault that you wish to view
- `iVaultId` - GUID for the iVault that you wish to view

##### Blank Connections

- `location` - The spatial location for the blank connection.
- `extents` - The volume of interest, in meters, centered around location
- `szewTwinId` - GUID for the szewTwin (project, asset, etc.) that contains the iVault that you wish to views
- **Note**: The props above cannot be used in conjunction with iVaultId
- **Note**: `authClient` props will be optional if only `location` and `extents` props are supplied. However, if the `szewTwinId` prop also is passed into the Viewer component, `authClient` will be required.


#### Optional

- `changeSetId` - Changeset id to view if combined with the szewTwinId and iVaultId props
- `blankConnectionViewState` - Override options for the ViewState that is generated for the BlankConnection
- `backendConfiguration` - Manage backend(s) connection info and RPC Interfaces. [See below](#backend-configuration)
- `theme` - Override the default theme
- `defaultUiConfig` - hide parts of the default frontstage
  - `hideNavigationAid` - hide the navigation aid cube
  - `hideStatusBar` - hide the status bar
- `onIVaultConnected` - Callback function that executes after the iVault connection is successful and contains the iVault connection as a parameter
- `frontstages` - Provide additional frontstages for the viewer to render
- `backstageItems` - Provide additional backstage items for the viewer's backstage composer
- `viewportOptions` - Additional options for the default frontstage's IVaultViewportControl
- `uiProviders` - Extend the viewer's default ui
- `viewCreatorOptions` - Options for creating the default viewState
- `loadingComponent` - provide a custom React component to override the spinner when an iVault is loading
- `productId` - application's GPRID
- `i18nUrlTemplate` - Override the default url template where i18n resource files are queried
- `onIVaultAppInit` - Callback function that executes after IVaultApp.startup completes
- `additionalI18nNamespaces` - Additional i18n namespaces to register
- `extensions` - Provide extensions for the viewer
- `hubAccess` - Optional `hubAccess` to override the Viewer's default hub access
- `mapLayerOptions` - Optional key value pair to provide map layers
- `toolAdmin` - Optional `ToolAdmin` to override the Viewer's default tool admin
- `tileAdmin` - Optional `tileAdmin` to override the Viewer's default tile admin
- `renderSys` - Optional `renderSys` to override the Viewer's default render system
- `realityDataAccess` - Optional `realityDataAccess` to override the Viewer's default reality data access
- `localization` - Optional `localization` to provide your own Localization instance

## Blank Viewer

For cases where you would prefer to use a [Blank iVaultConnection](https://www.szewtwinjs.org/learning/frontend/blankconnection/), you should supply the `location` and `extents` props to the Viewer React component. The `authClient` props will be optional unless the `szewTwinId` prop is also supplied.

```javascript
import React, { useState, useEffect } from "react";
import { BlankConnectionViewState, Viewer } from "@szewtwin/web-viewer-react";
import { Range3d } from "@szewtwin/core-geometry";
import { Cartographic, ColorDef } from "@szewtwin/core-common";
import { BrowserAuthorizationClient } from "@szewtwin/browser-authorization";

export const MyBlankViewerComponent = () => {
  const blankConnectionViewState: BlankConnectionViewState = {
    displayStyle: {
      backgroundColor: ColorDef.blue,
    },
  };

  const authClient = useMemo(
    () =>
      new BrowserAuthorizationClient({
        scope: "profile email",
        clientId: "my-oidc-client",
        redirectUri: "https://myredirecturi.com",
        postSignoutRedirectUri: "https://mypostsignouturi.com",
        responseType: "code",
      }),
    []
  );

  return (
    <Viewer
      authClient={authClient}
      location={Cartographic.fromDegrees(0, 0, 0)}
      extents={new Range3d(-30, -30, -30, 30, 30, 30)}
      blankConnectionViewState={blankConnectionViewState}
    />
  );
};
```

## Backend Configuration

If no `backendConfiguration` is specified, the backend defaults to the szewTwin Platform's iVault Access Service. You can modify or override this default backend, add additional RpcInterfaces to it, and/or add additional backends. The below examples are not mutually exclusive.

### Default Backend

#### Change default backend details

```javascript
    // ... rest of code omitted
    <Viewer
      // ...other props omitted
      backendConfiguration={{
        defaultBackend: {
          config: {
            info: {
              title: "New Default Backend Title",
              version: "v5.0"
            },
            uriPrefix: "https://new-default-backend-uri"
          }
        }
      }}
    />
```

#### Add additional RPC Interfaces to Default Backend

```javascript
    // ... rest of code omitted
    <Viewer
      // ...other props omitted
      backendConfiguration={{
        defaultBackend: {
          rpcInterfaces: [
            MyRpcInterface,
            AnotherRpcInterface
          ]
        }
      }}
    />
```

### Custom Backends

Add one or more custom backends with any number of RPC Interfaces registered against each.

#### Example

```javascript
    // ... rest of code omitted
    <Viewer
      // ...other props omitted
      backendConfiguration={{
        customBackends: [
          { 
            config: {
              info: {
                title: "Custom Backend One",
                version: "v3.0"
              },
              uriPrefix: "https://custom-backend-uri"
            },
            rpcInterfaces: [
              BackendOneRpcInterface,
              BackendOneRpcInterfaceTwo
            ]
          },
          { 
            config: {
              info: {
                title: "Custom Backend Two",
                version: "v4.0"
              },
              uriPrefix: "https://custom-backend-two-uri"
            },
            rpcInterfaces: [
              BackendTwoRpcInterface
            ]
          }
        ]
      }}
    />
```

## Development

When making changes to the src, run `npm start` in the package's root folder to enable source watching and rebuild, so the dev-server will have access to updated code on successful code compilation.

## Next Steps

[Extending the szewTwin Viewer](https://www.szewtwinjs.org/learning/tutorials/hello-world-viewer/)
