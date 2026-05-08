"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { useMousePosition } from "@/hooks/useMousePosition";

export function ProximityPanel({
  children,
  rotation = 0,
  delay = 0,
}: {
  children: React.ReactNode;
  rotation?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useMousePosition();
  const [proximity, setProximity] = useState(0);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt((mouse.x - cx) ** 2 + (mouse.y - cy) ** 2);
    setProximity(Math.max(0, 1 - dist / 380));
  }, [mouse.x, mouse.y]);

  return (
    <motion.div
      ref={ref}
      className="relative border p-6"
      style={{
        rotate: rotation,
        borderColor: `rgba(0,229,255,${0.07 + proximity * 0.32})`,
        boxShadow: `0 0 ${28 * proximity}px rgba(0,229,255,${0.14 * proximity}), inset 0 0 ${12 * proximity}px rgba(0,229,255,${0.04 * proximity})`,
        background: `rgba(0,229,255,${0.015 + proximity * 0.038})`,
        transition: "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
      }}
      initial={{ opacity: 0, scale: 0.94, rotate: rotation - 4 }}
      animate={inView ? { opacity: 1, scale: 1, rotate: rotation } : {}}
      transition={{ type: "spring", stiffness: 76, damping: 13, delay }}
    >
      <div
        className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(0,229,255,${0.35 + proximity * 0.65})`,
          boxShadow: `0 0 6px rgba(0,229,255,${0.4 + proximity * 0.6})`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(0,229,255,${0.35 + proximity * 0.65})`,
          boxShadow: `0 0 6px rgba(0,229,255,${0.4 + proximity * 0.6})`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(0,229,255,${0.25 + proximity * 0.55})`,
          boxShadow: `0 0 6px rgba(0,229,255,${0.3 + proximity * 0.5})`,
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full"
        style={{
          background: `rgba(0,229,255,${0.25 + proximity * 0.55})`,
          boxShadow: `0 0 6px rgba(0,229,255,${0.3 + proximity * 0.5})`,
        }}
      />
      {children}
    </motion.div>
  );
}
