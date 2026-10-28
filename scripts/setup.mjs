#!/usr/bin/env node
/**
 * Creates what the marketplace demo needs on the Didit application behind
 * API_KEY: the buyer age and key person ID workflows, the seller KYB workflow ("Demo - Marketplace
 * seller KYB") and the three transaction-monitoring rules. The definitions are
 * in lib/marketplace/setup.ts - the same objects the page's "How this uses
 * Didit" panel describes.
 *
 * Idempotent: the workflow is found by name and every rule by title, so a
 * re-run only creates what is missing. Existing workflows are never edited or
 * deleted. If the API refuses the create (an application holds at most 50
 * workflows), the application's existing KYB workflow is used instead. Rules
 * follow the rollout the Rules API recommends: created in TEST mode, then
 * switched to ACTIVE.
 *
 * Usage (reads API_KEY from .env):
 *   npm run setup                 # creates what is missing, rules ACTIVE
 *   npm run setup -- --dry-run    # prints what exists and what would be created
 *
 * The workflow ids are written to .env; add them to the hosting environment's
 * variables too.
 *
 * https://docs.didit.me/management-api/workflows/create
 * https://docs.didit.me/transaction-monitoring/rules-api
 */

import { SELLER_COUNTRIES } from "../lib/marketplace/catalog.ts";
import { API_BASE, ensureWorkflows, writeEnv } from "./lib/workflows.mjs";
import {
  KYB_WORKFLOW_LABEL,
  ensureKybWorkflow,
  isWorkflowLimitError,
  ruleDefinitions,
} from "../lib/marketplace/setup.ts";

const KYB_ENV = "DIDIT_WORKFLOW_SELLER_KYB";
const AGE_ENV = "DIDIT_WORKFLOW_BUYER_AGE";
const PERSON_ENV = "DIDIT_WORKFLOW_PERSON_KYC";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const activate = !dryRun;
const apply = !dryRun;

const base = API_BASE;

async function call(method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      "x-api-key": process.env.API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  return {
    status: response.status,
    body: await response.json().catch(() => null),
  };
}

async function didit(method, path, body) {
  const reply = await call(method, path, body);

  if (reply.status >= 400) {
    throw new Error(
      `${method} ${path} -> ${reply.status} ${JSON.stringify(reply.body)}`,
    );
  }

  return reply.body;
}

async function listAll(path) {
  const rows = [];
  let next = `${path}?limit=100`;

  while (next) {
    const data = await didit("GET", next);
    const page = Array.isArray(data) ? data : (data?.results ?? []);

    rows.push(...page);
    next =
      !Array.isArray(data) && data?.next
        ? data.next.replace(/^https?:\/\/[^/]+/, "")
        : null;
  }

  return rows;
}

async function ensureWorkflow(personWorkflowId) {
  const setup = await ensureKybWorkflow(call, {
    apply,
    countries: SELLER_COUNTRIES.map((country) => country.code),
    personWorkflowUuid: personWorkflowId,
  });

  if (setup.refusal) {
    const reason = isWorkflowLimitError(setup.refusal.body)
      ? `the application already holds ${setup.workflowCount} workflows (archived ones included) and is at its workflow limit`
      : `the API answered ${setup.refusal.status} ${JSON.stringify(setup.refusal.body)}`;

    console.log(`"${KYB_WORKFLOW_LABEL}": NOT created - ${reason}.`);
  }

  switch (setup.outcome) {
    case "found":
      console.log(`"${KYB_WORKFLOW_LABEL}": ${setup.workflow.id}`);
      break;
    case "created":
      console.log(`"${KYB_WORKFLOW_LABEL}": created ${setup.workflow.id}`);
      break;
    case "existing":
      console.log(
        `Using the application's existing KYB workflow instead: "${setup.workflow.label}" ${setup.workflow.id}`,
      );
      break;
    default:
      console.log(
        setup.refusal
          ? "No KYB workflow exists on this application to use instead. Free a workflow slot in the console, then re-run."
          : `"${KYB_WORKFLOW_LABEL}": not created yet.`,
      );
  }

  return setup.workflow?.id ?? null;
}

async function ensureRules(ageWorkflowId) {
  const rules = await listAll("/v3/transactions/rules/");

  for (const definition of ruleDefinitions(ageWorkflowId)) {
    let rule = rules.find((candidate) => candidate.title === definition.title);

    if (!rule && !apply) {
      console.log(`Rule "${definition.title}": not created yet.`);
      continue;
    }
    if (!rule) {
      rule = await didit("POST", "/v3/transactions/rules/", {
        ...definition,
        mode: "TEST",
      });
      console.log(`Rule "${definition.title}": created ${rule.uuid} in TEST.`);
    } else {
      console.log(`Rule "${definition.title}": ${rule.uuid} (${rule.mode}).`);
    }

    if (activate && rule.mode !== "ACTIVE") {
      rule = await didit("PATCH", `/v3/transactions/rules/${rule.uuid}/`, {
        mode: "ACTIVE",
      });
      console.log(`  switched to ACTIVE.`);
    }
  }
}

async function main() {
  if (!process.env.API_KEY) {
    console.error("API_KEY is not set - copy .env.example to .env first.");
    process.exit(1);
  }

  console.log(`Application behind API_KEY on ${base}\n`);

  const ids = await ensureWorkflows({
    apiKey: process.env.API_KEY,
    dryRun: !apply,
    only: [AGE_ENV, PERSON_ENV],
  });
  const workflowId = await ensureWorkflow(ids[PERSON_ENV]);

  await ensureRules(ids[AGE_ENV]);

  if (apply && workflowId) writeEnv({ ...ids, [KYB_ENV]: workflowId });
  if (!apply) console.log("\nDry run. Run without --dry-run to create what is missing.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
