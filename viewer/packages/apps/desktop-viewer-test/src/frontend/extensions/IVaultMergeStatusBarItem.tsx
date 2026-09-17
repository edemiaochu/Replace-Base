/*---------------------------------------------------------------------------------------------
* Copyright (c) Szewec Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import "./IVaultMergeStatusBarItem.scss";

import type { StatusBarItem, UiItemsProvider } from "@szewtwin/appui-react";
import { StageUsage, StatusBarSection } from "@szewtwin/appui-react";
import {
  StatusBarItemUtilities,
  useActiveIVaultConnection,
} from "@szewtwin/appui-react";
import { InternetConnectivityStatus } from "@szewtwin/core-common";
import type { BriefcaseConnection } from "@szewtwin/core-frontend";
import { IVaultApp } from "@szewtwin/core-frontend";
import {
  getBriefcaseStatus,
  ModelStatus,
  useAccessToken,
  useConnectivity,
  useIsMounted,
} from "@szewtwin/desktop-viewer-react";
import { SvgCloud, SvgOffline } from "@szewtwin/szewtwinui-icons-react";
import { useCallback, useEffect, useState } from "react";

import { SZEWTwinViewerApp } from "../app/SZEWTwinViewerApp";
import { BriefcaseStatus } from "../components/modelSelector";
import { usePullChanges } from "../hooks/usePullChanges";
import { isElectronRendererAuth } from "../util/typeCheck";

const ConnectionStatusBarItem = () => {
  const accessToken = useAccessToken();
  const connectivityStatus = useConnectivity();
  const onLoginClick = useCallback(async () => {
    if (
      isElectronRendererAuth(IVaultApp.authorizationClient)
    ) {
      await IVaultApp.authorizationClient?.signIn();
    }
  }, []);
  return (
    <div className="status-bar-status">
      <span className="status-label">
        {SZEWTwinViewerApp.translate("briefcaseStatusTitle.connection")}
      </span>
      {accessToken &&
        connectivityStatus === InternetConnectivityStatus.Online ? (
        <SvgCloud className="connection-status-icon" />
      ) : (
        <SvgOffline
          className="connection-status-icon actionable"
          onClick={onLoginClick}
        />
      )}
    </div>
  );
};

const MergeStatusBarItem = () => {
  const [mergeStatus, setMergeStatus] = useState<ModelStatus>();
  const [connection, setConnection] = useState<BriefcaseConnection>();
  const accessToken = useAccessToken();
  const connectivityStatus = useConnectivity();
  const iVaultConnection = useActiveIVaultConnection();
  const isMounted = useIsMounted();

  const { pullProgress, doPullChanges } = usePullChanges(connection);

  useEffect(() => {
    const rmListener = connection?.txns.onChangesPulled.addListener(() => {
      IVaultApp.viewManager.refreshForModifiedModels(undefined);
    });
    return () => rmListener?.();
  }, [connection]);

  const getLatestChangesets = useCallback(async () => {
    try {
      await doPullChanges();
      if (isMounted.current) {
        setMergeStatus(ModelStatus.UPTODATE);
      }
    } catch (error) {
      console.error(error);
      setMergeStatus(ModelStatus.ERROR);
    }
  }, [doPullChanges, isMounted]);

  useEffect(() => {
    if (mergeStatus === ModelStatus.MERGING) {
      void getLatestChangesets();
    }
  }, [mergeStatus, getLatestChangesets]);

  useEffect(() => {
    if (connectivityStatus === InternetConnectivityStatus.Offline) {
      return;
    }

    if (accessToken && connection) {
      // temporarily show a spinner while querying
      setMergeStatus(ModelStatus.COMPARING);
      void getBriefcaseStatus(connection).then((status) => {
        if (isMounted.current) {
          setMergeStatus(status);
        }
      });
    }
  }, [connectivityStatus, accessToken, connection, isMounted]);

  useEffect(() => {
    if (isMounted.current) {
      if (iVaultConnection?.isSnapshot) {
        setConnection(undefined);
        setMergeStatus(ModelStatus.SNAPSHOT);
      } else if (
        iVaultConnection?.isBriefcase &&
        iVaultConnection?.szewTwinId &&
        iVaultConnection.iVaultId
      ) {
        setConnection(iVaultConnection as BriefcaseConnection);
      }
    }
  }, [iVaultConnection, isMounted]);

  return mergeStatus === ModelStatus.SNAPSHOT ? null : (
    <div className="status-bar-status">
      <span className="status-label">
        {SZEWTwinViewerApp.translate("briefcaseStatusTitle.changes")}
      </span>
      <BriefcaseStatus
        mergeStatus={mergeStatus}
        mergeProgress={pullProgress}
        onMergeClick={() => {
          setMergeStatus(ModelStatus.MERGING);
        }}
        className={"status-bar-status"}
      />
    </div>
  );
};

export class IVaultMergeItemsProvider implements UiItemsProvider {
  public readonly id = "IVaultMergeItemsProvider";

  public provideStatusBarItems(
    _stageId: string,
    stageUsage: string
  ): StatusBarItem[] {
    const statusBarItems: StatusBarItem[] = [];
    if (stageUsage === StageUsage.General) {
      statusBarItems.push(
        StatusBarItemUtilities.createCustomItem({
          id: "IVaultMergeItemsProvider:ConnectionStatusBarItem",
          section: StatusBarSection.Center,
          itemPriority: 1,
          content: <ConnectionStatusBarItem />
        })
      );
      statusBarItems.push(
        StatusBarItemUtilities.createCustomItem({
          id: "IVaultMergeItemsProvider:IVaultMergeStatusBarItem",
          section: StatusBarSection.Center,
          itemPriority: 3,
          content: <MergeStatusBarItem />
        })
      );
    }
    return statusBarItems;
  }
}
