'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
  'http://localhost:3001/api';

function ReferralCaptureInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (!ref || ref.length > 100) return;

    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `ezzi_ref=${encodeURIComponent(ref)}; expires=${expires}; path=/; SameSite=Strict`;

    const sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);

    fetch(`${API_URL}/partners/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refCode: ref, sessionId }),
    }).catch(() => undefined);
  }, [searchParams]);

  return null;
}

export function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureInner />
    </Suspense>
  );
}
