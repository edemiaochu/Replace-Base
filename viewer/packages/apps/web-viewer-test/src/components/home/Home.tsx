/*---------------------------------------------------------------------------------------------
 * Copyright (c) Szewec Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import modelImg from "@szewec/icons-generic/icons/ivaultjs.svg";
import { Button } from "@szewtwin/szewtwinui-react";
import { useNavigate } from "react-router";

import { ReactComponent as SZEWtwin } from "../../images/szewtwin.svg";
import styles from "./Home.module.scss";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.title}>
          <p>
            <SZEWtwin className={styles.logo} />
            {"szewTwinViewer Sample App"}
          </p>
        </div>
        <img className={styles.img} src={modelImg} alt={"modelImage"} />
        <div className={styles.signIn}>
          <Button
            className={styles.homeButton}
            onClick={() => navigate("/viewer")}
            styleType={"high-visibility"}
            size={"large"}
          >
            {"Remote Connection"}
          </Button>
          <Button
            className={styles.homeButton}
            onClick={() => navigate("/blankconnection")}
            styleType={"cta"}
            size={"large"}
          >
            {"Blank Connection"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
