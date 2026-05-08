"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { OrbitalRing } from "./OrbitalRing";

export function StatOrb({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col items-center justify-center"
      style={{ width: 148, height: 148 }}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ type: "spring", stiffness: 76, damping: 11, delay: index * 0.17 }}
      whileHover={{ scale: 1.1 }}
    >
      <OrbitalRing size={148} speed={7 + index} />
      <OrbitalRing size={118} speed={4.5 + index * 0.6} reverse color="#00E5FF" />
      <div className="relative z-10 text-center">
        <div
          className="text-2xl font-bold"
          style={{ color: "#00E5FF", textShadow: "0 0 22px rgba(0,229,255,0.55)" }}
        >
          {value}
        </div>
        <div
          className="text-xs mt-1 tracking-widest"
          style={{ color: "rgba(0,229,255,0.45)" }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}
