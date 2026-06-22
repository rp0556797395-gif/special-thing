"use client"

import { motion } from "framer-motion"

const shapes = [
  { type: "circle", color: "bg-pink-400/20", size: "w-32 h-32", delay: 0 },
  { type: "square", color: "bg-cyan-400/20", size: "w-24 h-24", delay: 0.5 },
  { type: "triangle", color: "bg-yellow-400/20", size: "w-28 h-28", delay: 1 },
  { type: "circle", color: "bg-green-400/20", size: "w-20 h-20", delay: 1.5 },
  { type: "square", color: "bg-purple-400/20", size: "w-36 h-36", delay: 2 },
  { type: "circle", color: "bg-orange-400/20", size: "w-16 h-16", delay: 2.5 },
]

export function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Rotating light rays */}
      <div className="light-rays opacity-50" />
      
      {/* Floating shapes */}
      {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className={`absolute ${shape.size} ${shape.color} backdrop-blur-sm ${
            shape.type === "circle" ? "rounded-full" : shape.type === "square" ? "rounded-2xl rotate-45" : ""
          }`}
          style={{
            left: `${(index * 17) % 80 + 5}%`,
            top: `${(index * 23) % 70 + 10}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            rotate: shape.type === "square" ? [45, 90, 45] : [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + index * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        />
      ))}

      {/* Gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(255,0,150,0.3) 0%, transparent 70%)",
          right: "-10%",
          top: "10%",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(0,200,255,0.3) 0%, transparent 70%)",
          left: "-5%",
          bottom: "15%",
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}
