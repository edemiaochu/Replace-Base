# szewTwin Viewer for Desktop

The szewTwin Desktop Viewer is a configurable szewTwin.js viewer that offers basic configuration out-of-the-box and can be further extended through the use of [szewTwin.js UI Providers](https://www.szewtwinjs.org/learning/ui/augmentingui/). This package should be used for Electron-based desktop applications. For web applications, use [@szewtwin/web-viewer-react](https://www.npmjs.com/package/@szewtwin/web-viewer-react).

## Installation

```
yarn add @szewtwin/desktop-viewer-react
```

or

```
npm install @szewtwin/desktop-viewer-react
```

## Dependencies

If you are creating a new application and are using React, it is advised that you use create-react-app with `@szewec/react-scripts`. There is also a predefined template that includes the szewTwin Viewer package:

```
npx create-react-app@latest my-app --scripts-version @szewec/react-scripts --template @szewtwin/desktop-viewer
```

## React component

```javascript
import React, { useState, useEffect } from "react";
import { Viewer } from "@szewtwin/desktop-viewer-react";

export const MyViewerComponent = () => {
  const snapshotPath = "./samples/house_model.dtw";

  return (
    <Viewer filePath={snapshotPath} enablePerformanceMonitors={true} />
  );
};
```

### Props

#### Required

- `enablePerformanceMonitors` - Enable reporting of data from timed events in the szewTwin Viewer in order to aid in future performance optimizations. These are the metrics that will be collected and logged to the browser's performance timeline:
  - Duration of startup to the initialization of szewTwin.js services
  - Duration of startup to the establishment of a connection to the iVault
  - Duration of startup to the creation of a view state for the iVault
  - Duration of startup until the last tile is loaded and rendered for the initial iVault view

##### Local iVault

- `filePath` - path to a local Briefcase or Snapshot to load in the viewer. If provided, it will take precedence over any szewTwinId/iVaultId that may also be provided

##### Connected iVault

- `szewTwinId` - GUID for the szewTwin (project, asset, etc.) that contains the iVault that you wish to view
- `iVaultId` - GUID for the iVault that you wish to view

##### Blank Connections

- `location` - The spatial location for the blank connection.
- `extents` - The volume of interest, in meters, centered around location
Note that this can't be used in conjunction with the szewTwinId or iVaultId prop.

#### Optional

- `changeSetId` - Changeset id to view if combined with the szewTwinId and iVaultId props
- `blankConnectionViewState` - Override options for the ViewState that is generated for the BlankConnection

- `backend` - Backend connection info (defaults to the szewTwin Platform's iVault Access Service)

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
- `rpcInterfaces` - RPC interfaces to register (assumes that they are supported in your backend)
- `extensions` - Provide extensions for the viewer
- `hubAccess` - Optional `hubAccess` to override the Viewer's default hub access
- `mapLayerOptions` - Optional key value pair to provide map layers
- `toolAdmin` - Optional `ToolAdmin` to override the Viewer's default tool admin
- `tileAdmin` - Optional `tileAdmin` to override the Viewer's default tile admin
- `renderSys` - Optional `renderSys` to override the Viewer's default render system
- `realityDataAccess` - Optional `realityDataAccess` to override the Viewer's default reality data access
- `localization` - Optional `localization` to provide your own Localization instance

# Development

When making changes to the src, run `npm start` in the package's root folder to enable source watching and rebuild, so the dev-server will have access to updated code on successful code compilation.

# Next Steps

[Extending the szewTwin Viewer](https://www.szewtwinjs.org/learning/tutorials/hello-world-viewer/)
