"use client";

import { Printer } from "lucide-react";
import { buttonClass } from "@/components/ui";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className={buttonClass("secondary")}>
      <Printer className="size-4" aria-hidden="true" /> Print slip
    </button>
  );
}
