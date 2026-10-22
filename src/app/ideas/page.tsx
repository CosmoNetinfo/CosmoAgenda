"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SharedIdeasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sharedUrl = searchParams.get("url") || searchParams.get("text") || "";
    const sharedTitle = searchParams.get("title") || "";

    const query = new URLSearchParams();
    query.set("view", "ideas");
    if (sharedUrl) query.set("shared_url", sharedUrl);
    if (sharedTitle) query.set("shared_title", sharedTitle);

    router.replace(`/?${query.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <p className="text-xs font-bold text-plum-700 animate-pulse">
        Ricezione link condiviso in corso...
      </p>
    </div>
  );
}

export default function SharedIdeasRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
          <p className="text-xs font-bold text-plum-700">Caricamento...</p>
        </div>
      }
    >
      <SharedIdeasContent />
    </Suspense>
  );
}
