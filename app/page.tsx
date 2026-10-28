import { Metadata } from "next";
import { Suspense } from "react";

import "@/demo-layer/live.css";
import "@/styles/northmarket.css";

import { fontDmSans, fontFraunces } from "./fonts";

import { NorthmarketDemo } from "@/components/northmarket/northmarket-demo";

export const metadata: Metadata = {
  title: "Marketplace demo: Northmarket",
  description:
    "A fictional resale marketplace running Didit end to end: a passkey seller sign-up, KYB with each owner's ID before the first payout, a 1,497 EUR order waiting for a buyer age check and a second shop on the same device paused.",
  alternates: { canonical: "/" },
};

export default function MarketplacePage() {
  return (
    <div className={`${fontFraunces.variable} ${fontDmSans.variable}`}>
      <Suspense>
        <NorthmarketDemo />
      </Suspense>
    </div>
  );
}
