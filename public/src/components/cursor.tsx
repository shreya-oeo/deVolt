"use client";

import { useCursorStore } from "@/store/cursor";
import { cn } from "@/ui/cn";
import { motion, SpringOptions, useMotionTemplate, useSpring, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useEffect, useState } from "react";

const useMouseMove = ({ mass }: { mass: number }) => {
  const c: SpringOptions = {
    stiffness: 400,
    damping: 30,
    restDelta: 0.5,
    restSpeed: 0.5,
    mass: mass || 1.5,
    bounce: 0.5,
  };
  const [pos, setPos] = useState({ x: -1000, y: -1000 });

  const x = useSpring(pos.x, c);
  const y = useSpring(pos.y, c);

  useEffect(() => {
    const handleMouse = (e: MouseEvent | TouchEvent) => {
      setPos(e instanceof MouseEvent ? { x: e.clientX, y: e.clientY } : { x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    document.addEventListener("mousemove", handleMouse);
    document.addEventListener("touchmove", handleMouse);
    return () => {
      document.removeEventListener("mousemove", handleMouse);
      document.removeEventListener("touchmove", handleMouse);
    };
  }, []);

  useEffect(() => {
    x.set(pos.x);
    y.set(pos.y);
  }, [pos, x, y]);

  return [x, y];
};

const Cursor = () => {
  const { opacity, _scaleMultiplier, setScaleMultiplier, setOpacity, mass, content, style, scale, className, rounding, enabled } = useCursorStore();

  const [x, y] = useMouseMove({ mass });

  const scaleSpring = useSpring(scale, {
    stiffness: 500,
    damping: 28,
  });
  const roundingSpring = useSpring(rounding, {
    stiffness: 500,
    damping: 28,
  });

  useEffect(() => {
    scaleSpring.set(scale * _scaleMultiplier);
    roundingSpring.set(rounding);
  }, [scale, rounding, _scaleMultiplier, scaleSpring, roundingSpring]);

  if (!enabled) return null;

  const transform = useMotionTemplate`translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0) scale3d(${scaleSpring}, ${scaleSpring}, 1)`;

  // Code for scaling cursor based on the velocity of mouse
  // useEffect(() => {
  //   transform.on("change", (v) => {
  //     const resultantVelocity = Math.sqrt(x.getVelocity() ** 2 + y.getVelocity() ** 2);
  //     const multiplierRange = 0.7 / gsap.utils.clamp(0.7, 1)(Math.cbrt(Math.abs(resultantVelocity / 3000)));
  //     setScaleMultiplier(multiplierRange);
  //   });
  // }, []);

  return (
    // TODO: Add cursor distortion on movements
    <motion.div
      style={{
        transform,
        borderRadius: useMotionTemplate`${roundingSpring}px`,
        ...style,
      }}
      // @ts-ignore
      className={`cursor hidden fixed size-36 top-0 left-0 z-1500 pointer-events-none md:grid place-items-center ${cn(className)}`}
    >
      <AnimatePresence mode="wait">{content}</AnimatePresence>
    </motion.div>
  );
};

export default Cursor;
