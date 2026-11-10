'use client';

import React from 'react';
import { ParallaxComponent } from '@/components/ui/parallax-scrolling';

export function ParallaxDemo() {
  return (
    <div className="relative w-full">
      <ParallaxComponent title="LShorter" subtitle="Ultra-Low Latency Routing" />
      <div className="osmo-credits py-6 text-center text-xs text-muted-foreground border-t border-border/40">
        <p className="osmo-credits__p">
          Resource by{' '}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.osmo.supply/"
            className="osmo-credits__p-a underline hover:text-foreground transition-colors"
          >
            Osmo
          </a>
        </p>
      </div>
    </div>
  );
}

export default ParallaxDemo;
