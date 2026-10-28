/**
 * Which Didit objects the marketplace runs against.
 *
 * The workflow ids are configuration, not code: `npm run setup` creates the
 * workflows (and the transaction rules) on your Didit application and writes
 * the ids to .env (see lib/didit/demos.ts). A KYB registry search with owners
 * is priced per business, see https://docs.didit.me/getting-started/pricing.
 */
export interface MarketWorkflows {
  /** The seller KYB workflow (DIDIT_WORKFLOW_SELLER_KYB). Empty until set. */
  kyb: string;
  /** The age check the high-value rule opens for buyers. */
  age: string;
  /** The ID check each key person of a seller runs. */
  person: string;
}
