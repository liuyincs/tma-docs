import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

type Feature = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: translate({
      id: "homepage.features.workbench.title",
      message: "Tag workbench",
    }),
    description: translate({
      id: "homepage.features.workbench.description",
      message:
        "Browse, search and edit tags and cover art, and run batch jobs such as renaming, moving, lyrics and ReplayGain.",
    }),
  },
  {
    title: translate({
      id: "homepage.features.server.title",
      message: "Music server",
    }),
    description: translate({
      id: "homepage.features.server.description",
      message:
        "Browse tracks, albums, artists and playlists, and play them in the built-in web player.",
    }),
  },
  {
    title: translate({
      id: "homepage.features.nearStorage.title",
      message: "Runs next to your library",
    }),
    description: translate({
      id: "homepage.features.nearStorage.description",
      message:
        "Deploy the server on your NAS, home server or remote host and edit files in place from the browser.",
    }),
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title={translate({ id: "homepage.title", message: "Home" })}
      description={translate({
        id: "homepage.description",
        message: "Self-hosted audio tag manager and music server",
      })}
    >
      <header className={styles.hero}>
        <div className="container">
          <img className={styles.logo} src="/img/logo.svg" alt="Tag My Audio" />
          <Heading as="h1" className={styles.title}>
            Tag My Audio
          </Heading>
          <p className={styles.tagline}>
            <Translate id="homepage.tagline">
              Self-hosted audio tag manager and music server for NAS, home servers and remote hosts.
            </Translate>
          </p>
          <div className={styles.buttons}>
            <Link className="button button--primary button--lg" to="/docs/intro">
              <Translate id="homepage.cta.docs">Read the docs</Translate>
            </Link>
            <Link
              className="button button--secondary button--lg"
              href="https://github.com/liuyincs/tma-docs/issues/new/choose"
            >
              <Translate id="homepage.cta.feedback">Send feedback</Translate>
            </Link>
          </div>
        </div>
      </header>
      <main className="container">
        <section className={styles.features}>
          {features.map((feature) => (
            <div key={feature.title} className={styles.feature}>
              <Heading as="h3">{feature.title}</Heading>
              <p>{feature.description}</p>
            </div>
          ))}
        </section>
      </main>
    </Layout>
  );
}
