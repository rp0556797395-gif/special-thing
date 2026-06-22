"use client"

import { motion } from "framer-motion"

interface EventMarqueeProps {
  eventName: string
}

export function EventMarquee({ eventName }: EventMarqueeProps) {
  const repeatedText = Array(10).fill(eventName).join(" ★ ")

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-pink-500/10 via-cyan-500/10 to-pink-500/10 py-3">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{
          x: [0, -2000],
        }}
        transition={{
          x: {
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          },
        }}
      >
        <span
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500 bg-clip-text text-transparent px-4"
          style={{
            backgroundSize: "200% 100%",
          }}
        >
          {repeatedText}
        </span>
        <span
          className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-500 via-yellow-500 to-cyan-500 bg-clip-text text-transparent px-4"
          style={{
            backgroundSize: "200% 100%",
          }}
        >
          {repeatedText}
        </span>
      </motion.div>
    </div>
  )
}
