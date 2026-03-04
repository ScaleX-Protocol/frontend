// In Vite config context, use process.env which is available at build time
// In runtime (app code), use import.meta.env
 
const ROOT_URL = process.env.VITE_BASE_URL || "https://base-sepolia-app.scalex.money";

export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjI2NTUzMiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDUwZDZDNmVFNTQyOTcxODYzMEJkODExMDFlMDM2RGM5NDQ3MzZDMkYifQ",
    payload: "eyJkb21haW4iOiJiYXNlLXNlcG9saWEtYXBwLnNjYWxleC5tb25leSJ9",
    signature: "R6JYweLp3lVMGYLFxasJlBQmPVUYT2d3JELALAp1fElX8IYNh1wtq14KLk2FAiULPKmP3mbPHv8OQf7trpTvTxs="
  },
  miniapp: {
    version: "1",
    name: "ScaleX",
    subtitle: "Cross-Chain Trading Platform",
    description: "A comprehensive cross-chain trading platform for seamless crypto trading, lending, and portfolio management.",
    screenshotUrls: [`${ROOT_URL}/screenshot.png`,`${ROOT_URL}/screenshot2.png`,`${ROOT_URL}/screenshot3.png`],
    iconUrl: `${ROOT_URL}/images/logo/ScaleX-Logo.png`,
    imageUrl: `${ROOT_URL}/screenshot.png`,
    splashImageUrl: `${ROOT_URL}/images/logo/ScaleX-Logo.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trading", "defi", "crypto", "cross-chain"],
    heroImageUrl: `${ROOT_URL}/waitlist-page.png`,
    tagline: "Trading Made Simple",
    ogTitle: "Cross-Chain Trading Platform",
    ogDescription: "Seamless cross-chain trading, lending, and portfolio management.",
    ogImageUrl: `${ROOT_URL}/screenshot.png`,
    noindex: false
  },
} as const;
