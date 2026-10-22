import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Tag My Audio",
  tagline: "Self-hosted audio tag manager and music server",
  favicon: "img/favicon.svg",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://tma.musiver.cn",
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: "/",

  organizationName: "liuyincs", // Usually your GitHub org/user name.
  projectName: "tma-docs", // Usually your repo name.

  onBrokenLinks: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh-Hans"],
    localeConfigs: {
      "zh-Hans": {
        label: "简体中文",
      },
      en: {
        label: "English",
      },
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl: "https://github.com/liuyincs/tma-docs/tree/main/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // TODO: add a social card image (e.g. img/tma-social-card.jpg)
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Tag My Audio",
      logo: {
        alt: "Tag My Audio Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          to: "/",
          label: "Home",
          position: "left",
          activeBaseRegex: "^(?:/|/[\\w-]+/)$",
        },
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Docs",
        },
        {
          type: "localeDropdown",
          position: "right",
          queryString: "?persistLocale=true",
        },
        {
          href: "https://github.com/liuyincs/tma-docs",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },
    footer: {
      copyright: "© 2026 Tag My Audio. All rights reserved.",
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
