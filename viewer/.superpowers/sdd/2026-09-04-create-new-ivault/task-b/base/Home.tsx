/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./Home.scss";

import { InternetConnectivityStatus } from "@szewtwin/core-common";
import { useConnectivity } from "@szewtwin/desktop-viewer-react";
import { SvgFolderOpened, SvgIvault } from "@szewtwin/szewtwinui-icons-react";
import { PageLayout } from "@szewtwin/szewtwinui-layouts-react";
import { Blockquote, Text } from "@szewtwin/szewtwinui-react";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SZEWTwinViewerApp } from "../../app/SZEWTwinViewerApp";
import { SettingsContext } from "../../services/SettingsContext";
import { Recents } from "./Recents";

interface LearnLink {
  textKey: string;
  url: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [learnLinks, setLearnLinks] = useState<LearnLink[]>([]);
  const [linkClass, setLinkClass] = useState<string>();
  const userSettings = useContext(SettingsContext);
  const connectivityStatus = useConnectivity();

  useEffect(() => {
    void fetch("./links.json").then((response) => {
      if (response.status >= 200 && response.status < 300) {
        void response.json().then((links) => {
          setLearnLinks(links);
        });
      }
    });
  }, []);

  useEffect(() => {
    setLinkClass(
      connectivityStatus === InternetConnectivityStatus.Offline
        ? "disabled-link"
        : ""
    );
  }, [connectivityStatus]);

  const openFile = async () => {
    const filePath = await SZEWTwinViewerApp.getFile();
    if (filePath) {
      void userSettings.addRecent(filePath);
      void navigate("/viewer", { state: { filePath } });
    }
  };

  return (
    <>
      <PageLayout.TitleArea>
        <Text className="home-title" variant="headline">
          szewTwin Viewer for Desktop
        </Text>
      </PageLayout.TitleArea>
      <div className="home">
        <div className="home-section start">
          <Text variant="title"> {SZEWTwinViewerApp.translate("home.start")}</Text>
          <nav>
            <div>
              <SvgFolderOpened />
              <span onClick={openFile}>{SZEWTwinViewerApp.translate("open")}</span>
            </div>
            <div>
              <SvgIvault className={linkClass} />
              <Link to="szewtwins" className={linkClass}>
                {SZEWTwinViewerApp.translate("download")}
              </Link>
            </div>
          </nav>
        </div>
        <div className="home-section learn">
          <Text variant="title"> {SZEWTwinViewerApp.translate("home.learn")}</Text>
          {learnLinks.map((link) => {
            return (
              <Blockquote key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className={linkClass}
                >
                  {SZEWTwinViewerApp.translate(link.textKey)}
                </a>
              </Blockquote>
            );
          })}
        </div>
        <div className="home-section recent">
          <Text variant="title">
            {SZEWTwinViewerApp.translate("home.openRecent")}
          </Text>
          <Recents />
        </div>
      </div>
    </>
  );
};

export default Home;
