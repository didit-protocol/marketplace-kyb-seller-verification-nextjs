/**
 * The demo definition: brand, workflows (ids come from the environment, see
 * `npm run setup`), the rules the demo enforces and its copy. The Demo bar,
 * the Didit live layer and the route handlers read it from here.
 *
 * No `@/` imports: the setup script loads the policy that reads this file
 * straight from Node.
 */

import { defineDemo, workflowId } from "./config.ts";

export const northmarket = defineDemo({
  id: "northmarket",
  route: "/",
  industry: "Marketplace",
  brand: { name: "Northmarket", initial: "N", mark: "#F06A1D" },
  vendorPrefix: "northmarket-",
  workflows: {
    sellerKyb: workflowId("DIDIT_WORKFLOW_SELLER_KYB"),
    buyerAge: workflowId("DIDIT_WORKFLOW_BUYER_AGE"),
    person: workflowId("DIDIT_WORKFLOW_PERSON_KYC"),
  },
  rules: {
    kybBeforePayout: "Sellers pass KYB before their first payout",
    ageAt1000: "Orders over 1,000 EUR wait for a buyer age check",
  },
  copy: {
    tagline: "Vintage and design resale",
    story:
      "Sellers pass KYB before their first payout, large orders wait for a quick age check, and a second shop on the same device is paused.",
  },
});

export const DEMOS = [northmarket];
