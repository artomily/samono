"use client";

import { motion } from "motion/react";

export function OrbitalRing({
  size,
  speed,
  color = "#00E5FF",
  reverse = false,
}: {
  size: number;
  speed: number;
  color?: string;
  reverse?: boolean;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        border: `1px solid ${color}28`,
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 4,
          height: 4,
          background: color,
          boxShadow: `0 0 8px ${color}`,
          top: -2,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
    </motion.div>
  );
}
