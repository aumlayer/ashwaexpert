"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glareEnabled?: boolean;
  tiltMaxAngle?: number;
}

export function TiltCard({
  children,
  className,
  glareEnabled = true,
  tiltMaxAngle = 15,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateXValue = (mouseY / (rect.height / 2)) * -tiltMaxAngle;
    const rotateYValue = (mouseX / (rect.width / 2)) * tiltMaxAngle;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);

    // Glare position
    const glareX = ((e.clientX - rect.left) / rect.width) * 100;
    const glareY = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePosition({ x: glareX, y: glareY });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={cn(
        "relative rounded-card border border-border bg-surface shadow-sm overflow-hidden",
        "transition-shadow duration-300 hover:shadow-xl",
        className
      )}
    >
      {children}

      {/* Glare effect */}
      {glareEnabled && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
          }}
        />
      )}

      {/* Floating shadow */}
      <div
        className="absolute -bottom-4 left-4 right-4 h-8 rounded-full bg-black/10 blur-xl -z-10 transition-transform duration-300"
        style={{
          transform: `translateX(${rotateY * 0.5}px) translateY(${Math.abs(rotateX) * 0.2}px)`,
        }}
      />
    </motion.div>
  );
}
