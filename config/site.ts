export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Northmarket",
  description: "A fictional resale marketplace running Didit end to end: a passkey seller sign-up, KYB with each owner's ID before the first payout, a 1,497 EUR order waiting for a buyer age check and a second shop on the same device paused.",
  /** This app's public URL. Callbacks and redirects are built from it. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  links: {
    console: "https://business.didit.me",
    docs: "https://docs.didit.me",
    website: "https://didit.me",
  },
};
