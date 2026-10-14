"use client";

import React, { useEffect, useState } from "react";
import MfadGeoRadarMap from "@/components/admin/MfadGeoRadarMap";
import { MOCK_MFAD_TARGETS } from "@/lib/mfadSeed";
import { getCurrentAuthUser } from "@/lib/auth/kakaoAuth";
import type { AuthProfile } from "@/types/auth";

export default function MfadRadarPage() {
  const [currentUser, setCurrentUser] = useState<AuthProfile | null>(null);

  useEffect(() => {
    getCurrentAuthUser().then(setCurrentUser);
  }, []);

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-slate-900 flex flex-col font-sans">
      <MfadGeoRadarMap initialTargets={MOCK_MFAD_TARGETS} currentUser={currentUser} />
    </div>
  );
}
