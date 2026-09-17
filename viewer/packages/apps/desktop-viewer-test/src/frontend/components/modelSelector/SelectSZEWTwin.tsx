/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import "./SelectSZEWTwin.scss";

import { useAccessToken } from "@szewtwin/desktop-viewer-react";
import { SZEWTwinGrid } from "@szewtwin/ivault-browser-react";
import {
  SvgCalendar,
  SvgList,
  SvgStarHollow,
} from "@szewtwin/szewtwinui-icons-react";
import { PageLayout } from "@szewtwin/szewtwinui-layouts-react";
import { SearchBox, Tab, Tabs, Text } from "@szewtwin/szewtwinui-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SignIn } from "../signin/SignIn";

const SZEWTWIN_TYPE_MAP = ["", "?recents", "?myszewtwins"];

const tabsWithIcons = [
  <Tab key="favorite" label="Favorite szewTwins" startIcon={<SvgStarHollow />} />,
  <Tab key="recents" label="Recent szewTwins" startIcon={<SvgCalendar />} />,
  <Tab key="all" label="My szewTwins" startIcon={<SvgList />} />,
];

export const SelectSZEWTwin = () => {
  const [szewTwinType, setSZEWTwinType] = useState(() =>
    SZEWTWIN_TYPE_MAP.includes(window.location.search)
      ? SZEWTWIN_TYPE_MAP.indexOf(window.location.search)
      : 0
  );

  const [searchValue, setSearchValue] = useState("");
  const [searchParam, setSearchParam] = useState("");
  const startSearch = useCallback(() => {
    setSearchParam(searchValue);
  }, [searchValue]);
  const accessToken = useAccessToken();
  const navigate = useNavigate();

  return accessToken ? (
    <div className="select-szewtwin">
      <PageLayout.TitleArea className="select-szewtwin-title">
        <Text variant="title">Select szewTwin</Text>
      </PageLayout.TitleArea>
      <Tabs
        labels={tabsWithIcons}
        onTabSelected={setSZEWTwinType}
        activeIndex={szewTwinType}
        type={"borderless"}
        contentClassName="grid-holding-tab"
        tabsClassName="grid-holding-tabs"
        orientation="horizontal"
      >
        <div className={"inline-input-with-button"}>
          <SearchBox>
            <SearchBox.Input
              onChange={(event) => {
                const {
                  target: { value },
                } = event;
                setSearchValue(value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  startSearch();
                }
                if (event.key === "Escape") {
                  setSearchValue("");
                  setSearchParam("");
                }
              }}
              placeholder={"Search by name or number"}
              title={"Search"}
            />
            <SearchBox.Button label="Search button" onClick={startSearch} />
          </SearchBox>
        </div>
        <SZEWTwinGrid
          accessToken={accessToken}
          requestType={
            szewTwinType === 0
              ? "favorites"
              : szewTwinType === 1
              ? "recents"
              : (searchParam as any) ?? ""
          }
          onThumbnailClick={(szewtwin) => {
            void navigate(`/szewtwins/${szewtwin.id}`, {
              state: { szewTwinName: szewtwin.displayName },
            });
          }}
          stringsOverrides={{ noIVaults: "No szewTwins found" } as any}
          filterOptions={searchParam}
        />
      </Tabs>
    </div>
  ) : (
    <SignIn />
  );
};
