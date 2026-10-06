"use client";

import { useEffect, useState } from "react";

// The address is assembled in the browser so it never appears whole in the page source,
// which keeps it out of the simplest scrapers.
const USER = ["br", "ian"];
const HOST = ["thesmith", "syndicate", ".com"];

export function EmailLink({ className = "" }: { className?: string }) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    setAddress(`${USER.join("")}@${HOST.join("")}`);
  }, []);

  if (!address) {
    return (
      <span className={className}>
        {USER.join("")} [at] {HOST.join("")}
      </span>
    );
  }

  return (
    <a href={`mailto:${address}`} className={className}>
      {address}
    </a>
  );
}
