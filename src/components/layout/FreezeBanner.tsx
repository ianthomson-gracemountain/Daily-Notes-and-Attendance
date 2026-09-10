'use client';

import { useEffect, useState } from 'react';
import { isFrozen, formatFreezeDate } from '@/lib/freeze';

/**
 * Full-width read-only notice shown on every screen once the app is frozen.
 * The frozen check runs after mount because this app is a static export: the
 * HTML is prerendered at build time, so evaluating isFrozen() during render
 * would bake the build-day answer into the page.
 */
export default function FreezeBanner() {
  const [frozen, setFrozen] = useState(false);

  useEffect(() => {
    setFrozen(isFrozen());
  }, []);

  if (!frozen) return null;

  return (
    <div
      role="status"
      className="w-full bg-gm-gold text-white text-sm text-center px-4 py-3 leading-snug"
    >
      This app is closed. Daily notes and attendance now live in Summit
      (summit-app-gm.netlify.app). Everything entered here before{' '}
      {formatFreezeDate()} has been carried over.
    </div>
  );
}
