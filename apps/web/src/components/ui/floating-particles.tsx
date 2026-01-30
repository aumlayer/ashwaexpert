"use client";

import { motion } from "framer-motion";
import { Droplets } from "lucide-react";

interface FloatingParticlesProps {
  count?: number;
  color?: string;
  className?: string;
  icon?: "droplet" | "circle" | "dot";
}

export function FloatingParticles({
  count = 15,
  color = "primary",
  className = "",
  icon = "droplet",
}: FloatingParticlesProps) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 12 + 8,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 5,
  }));

  const colorClasses: Record<string, string> = {
    primary: "text-primary/20",
    accent: "text-accent/20",
    white: "text-white/20",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute ${colorClasses[color] || colorClasses.primary}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() > 0.5 ? 10 : -10, 0],
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        >
          {icon === "droplet" ? (
            <Droplets style={{ width: particle.size, height: particle.size }} />
          ) : icon === "circle" ? (
            <div
              className="rounded-full bg-current"
              style={{ width: particle.size, height: particle.size }}
            />
          ) : (
            <div
              className="rounded-full bg-current"
              style={{ width: particle.size / 2, height: particle.size / 2 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

interface GlowOrbsProps {
  count?: number;
  className?: string;
}

export function GlowOrbs({ count = 3, className = "" }: GlowOrbsProps) {
  const orbs = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 20 + i * 30,
    y: 20 + (i % 2) * 40,
    size: 200 + Math.random() * 200,
    duration: 10 + Math.random() * 5,
  }));

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface WavePatternProps {
  className?: string;
}

export function WavePattern({ className = "" }: WavePatternProps) {
  return (
    <div className={`absolute inset-x-0 bottom-0 overflow-hidden ${className}`}>
      <svg
        className="relative w-full h-24"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        fill="none"
      >
        <motion.path
          d="M0,50 C360,100 720,0 1080,50 C1260,75 1380,50 1440,50 L1440,100 L0,100 Z"
          fill="currentColor"
          className="text-surface/50"
          animate={{
            d: [
              "M0,50 C360,100 720,0 1080,50 C1260,75 1380,50 1440,50 L1440,100 L0,100 Z",
              "M0,60 C360,20 720,80 1080,40 C1260,55 1380,70 1440,60 L1440,100 L0,100 Z",
              "M0,50 C360,100 720,0 1080,50 C1260,75 1380,50 1440,50 L1440,100 L0,100 Z",
            ],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M0,70 C480,30 960,90 1440,70 L1440,100 L0,100 Z"
          fill="currentColor"
          className="text-surface/30"
          animate={{
            d: [
              "M0,70 C480,30 960,90 1440,70 L1440,100 L0,100 Z",
              "M0,60 C480,90 960,30 1440,60 L1440,100 L0,100 Z",
              "M0,70 C480,30 960,90 1440,70 L1440,100 L0,100 Z",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </svg>
    </div>
  );
}
