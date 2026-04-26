"use client";

import { useEffect, useRef, useState } from "react";

export interface MouseState {
  x: number;
  y: number;
  /** Normalized 0–1 across viewport width */
  nx: number;
  /** Normalized 0–1 across viewport height */
  ny: number;
  vx: number;
  vy: number;
  speed: number;
}

const INITIAL: MouseState = {
  x: 0,
  y: 0,
  nx: 0.5,
  ny: 0.5,
  vx: 0,
  vy: 0,
  speed: 0,
};

export function useMousePosition(): MouseState {
  const [state, setState] = useState<MouseState>(INITIAL);
  const prevRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(undefined);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const vx = e.clientX - prevRef.current.x;
        const vy = e.clientY - prevRef.current.y;
        prevRef.current = { x: e.clientX, y: e.clientY };
        setState({
          x: e.clientX,
          y: e.clientY,
          nx: e.clientX / window.innerWidth,
          ny: e.clientY / window.innerHeight,
          vx,
          vy,
          speed: Math.sqrt(vx * vx + vy * vy),
        });
      });
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return state;
}
