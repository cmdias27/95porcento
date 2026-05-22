// frontend/app/dashboard/modos/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ModosRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // Preserva query params para compatibilidade com links antigos
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
  }, [router, params]);

  return (
    <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ModosPage() {
  return (
    <Suspense fallback={
      <div className="h-[100dvh] bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ModosRedirect />
    </Suspense>
  );
}
