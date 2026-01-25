// This function will be called by vite.config.ts with the env variable
export function createMinikitConfig(rootUrl: string) {
  return {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "ScaleX",
    subtitle: "Trade Without Limits",
    description: "Trade Without Limits. Protect Against Chaos. Advanced perpetual trading platform with cross-margin, isolated margin, and comprehensive risk management.",
    screenshotUrls: [`${rootUrl}/images/screenshot.png`],
    iconUrl: `${rootUrl}/images/logo/scalex-icon.png`,
    splashImageUrl: `${rootUrl}/images/logo/scalex-logo.png`,
    splashBackgroundColor: "#0A0A0A",
    homeUrl: rootUrl,
    webhookUrl: `${rootUrl}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trading", "defi", "perpetuals", "leverage", "crypto"],
    heroImageUrl: `${rootUrl}/images/hero.png`,
    tagline: "Trade Without Limits",
    ogTitle: "ScaleX - Trade Without Limits",
    ogDescription: "Advanced perpetual trading platform with cross-margin, isolated margin, and comprehensive risk management.",
    ogImageUrl: `${rootUrl}/images/og-image.png`,
    noindex: false
  },
  } as const;
}
