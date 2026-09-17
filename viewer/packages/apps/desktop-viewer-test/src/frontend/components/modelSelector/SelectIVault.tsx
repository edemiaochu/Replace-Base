/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { BriefcaseConnection } from "@szewtwin/core-frontend";
import { getBriefcaseStatus, ModelStatus } from "@szewtwin/desktop-viewer-react";
import type { IVaultFull, IVaultGridProps } from "@szewtwin/ivault-browser-react";
import { IVaultGrid } from "@szewtwin/ivault-browser-react";
import { PageLayout } from "@szewtwin/szewtwinui-layouts-react";
import { Text, Tile } from "@szewtwin/szewtwinui-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { useDownload } from "../../hooks/useDownload";
import { usePullChanges } from "../../hooks/usePullChanges";
import { SettingsContext } from "../../services/SettingsContext";
import { IVaultContext } from "../routes";
import { BriefcaseStatus } from "./BriefcaseStatus";

interface SelectIVaultProps extends IVaultGridProps {
  szewTwinName?: string;
}

type TileProps = Omit<React.ComponentPropsWithoutRef<typeof Tile>, 'as'>;

const useProgressIndicator = (iVault: IVaultFull) => {
  const userSettings = useContext(SettingsContext);
  const [status, setStatus] = useState<ModelStatus>();
  const [briefcase, setBriefcase] = useState<BriefcaseConnection>();
  const modelContext = useContext(IVaultContext);
  const navigate = useNavigate();

  /**
   * Get the local file from settings
   * @returns
   */
  const getLocal = useCallback(() => {
    const recents = userSettings.settings.recents;
    if (recents) {
      return recents.find((recent) => {
        return (
          recent.szewTwinId === iVault.szewTwinId && recent.iVaultId === iVault.id
        );
      });
    }
  }, [userSettings, iVault.id, iVault.szewTwinId]);

  const getBriefcase = useCallback(async () => {
    // if there is a local file, open a briefcase connection and store it in state
    const local = getLocal();
    if (local?.path) {
      const connection = await BriefcaseConnection.openFile({
        fileName: local.path,
        readonly: true,
      });
      const briefcaseStatus = await getBriefcaseStatus(connection);

      if (briefcaseStatus === ModelStatus.UPTODATE) {
        await connection.close();
      } else {
        setBriefcase(connection);
      }
      setStatus(briefcaseStatus);
    } else {
      setStatus(ModelStatus.ONLINE);
    }
  }, [getLocal]);

  const { progress, doDownload } = useDownload(
    iVault.id,
    iVault.name ?? iVault.id,
    iVault.szewTwinId ?? ""
  );

  const startDownload = useCallback(async () => {
    try {
      setStatus(ModelStatus.DOWNLOADING);
      const fileName = await doDownload();
      if (fileName) {
        setStatus(ModelStatus.UPTODATE);
      } else {
        setStatus(ModelStatus.ONLINE);
      }
      return fileName;
    } catch (error) {
      console.log(error);
      setStatus(ModelStatus.ERROR);
    }
  }, [doDownload]);

  const { pullProgress, doPullChanges } = usePullChanges(briefcase);

  const mergeChanges = useCallback(async () => {
    setStatus(ModelStatus.MERGING);
    try {
      await doPullChanges();
      if (briefcase) {
        await briefcase.close();
      }
      setStatus(ModelStatus.UPTODATE);
    } catch (error) {
      console.error(error);
      setStatus(ModelStatus.ERROR);
    }
  }, [doPullChanges, briefcase]);

  useEffect(() => {
    if (!briefcase) {
      void getBriefcase();
    }
    return () => {
      if (briefcase) {
        void briefcase.close();
      }
    };
  }, [briefcase, getBriefcase]);

  useEffect(() => {
    const downloadAndNavigate = async () => {
      if (modelContext.pendingIVault === iVault.id) {
        const filePath = await startDownload();
        modelContext.setPendingIVault(undefined);
        if (filePath) {
          void navigate("/viewer", { state: { filePath } });
        }
      }
    };

    void downloadAndNavigate();
  }, [
    modelContext.pendingIVault,
    iVault.id,
    navigate,
    startDownload,
    modelContext,
  ]);

  const tileProps = useMemo<Partial<TileProps>>(() => {
    return {
      metadata: (
        <div
          style={{
            width: "100%",
            justifyContent: "flex-end",
            display: "flex",
          }}
        >
          <BriefcaseStatus
            mergeStatus={status}
            mergeProgress={pullProgress ?? progress}
            onMergeClick={mergeChanges}
            onDownloadClick={startDownload}
          />
        </div>
      ),
    };
  }, [progress, pullProgress, status, mergeChanges, startDownload]);
  return { tileProps };
};

export const SelectIVault = ({
  accessToken,
  szewTwinId,
  szewTwinName,
}: SelectIVaultProps) => {
  const navigate = useNavigate();
  const userSettings = useContext(SettingsContext);
  const modelContext = useContext(IVaultContext);

  const selectIVault = useCallback(
    async (iVault: IVaultFull) => {
      if (modelContext.pendingIVault) {
        // there is already a pending selection. disallow
        return;
      }
      const recents = userSettings.settings.recents;
      if (recents) {
        const local = recents.find((recent) => {
          return (
            recent.szewTwinId === iVault.szewTwinId && recent.iVaultId === iVault.id
          );
        });

        if (local) {
          // If there is file in recent settings, check if it exists on disk,
          // and navigate to path if it exists
          const exists = await userSettings.checkFileExists(local);
          if (exists) {
            void navigate("/viewer", { state: { filePath: local.path } });
            return;
          }
        }
      }
      // trigger a download/view
      modelContext.setPendingIVault(iVault.id);
    },
    [modelContext, userSettings, navigate]
  );

  return (
    <>
      <PageLayout.TitleArea>
        <Text variant="title">{`iVaults for ${szewTwinName}`}</Text>
      </PageLayout.TitleArea>

      <IVaultGrid
        accessToken={accessToken}
        szewTwinId={szewTwinId}
        onThumbnailClick={selectIVault}
        useIndividualState={useProgressIndicator}
      />
    </>
  );
};
