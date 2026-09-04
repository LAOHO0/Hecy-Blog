"use client";

import { useId } from "react";

export function NoiseTexture() {
  const filterId = useId();

  return (
    <svg
      aria-hidden="true"
      className="noise-texture"
      height="100%"
      preserveAspectRatio="none"
      width="100%"
    >
      <filter id={filterId} x="0" y="0" width="100%" height="100%">
        <feTurbulence
          baseFrequency="0.86"
          numOctaves="4"
          stitchTiles="stitch"
          type="fractalNoise"
        />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncR slope="0.15" type="linear" />
          <feFuncG slope="0.15" type="linear" />
          <feFuncB slope="0.15" type="linear" />
        </feComponentTransfer>
      </filter>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${filterId})`}
        opacity="0.34"
      />
    </svg>
  );
}
