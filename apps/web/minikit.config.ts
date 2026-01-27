// In Vite config context, use process.env which is available at build time
// In runtime (app code), use import.meta.env
 
const ROOT_URL = process.env.VITE_BASE_URL || "https://base-sepolia.scalex.money";

export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: ""
  },
  miniapp: {
    version: "1",
    name: "ScaleX",
    subtitle: "Cross-Chain Trading Platform",
    description: "A comprehensive cross-chain trading platform for seamless crypto trading, lending, and portfolio management.",
    screenshotUrls: [`${ROOT_URL}/docs-mockup.png`],
    iconUrl: `${ROOT_URL}/vite.svg`,
    splashImageUrl: `${ROOT_URL}/vite.svg`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trading", "defi", "crypto", "cross-chain"],
    heroImageUrl: `${ROOT_URL}/waitlist-page.png`,
    tagline: "Cross-Chain Trading Made Simple",
    ogTitle: "ScaleX - Cross-Chain Trading Platform",
    ogDescription: "Seamless cross-chain trading, lending, and portfolio management.",
    ogImageUrl: `${ROOT_URL}/waitlist-page.png`,
    noindex: false
  },
} as const;
