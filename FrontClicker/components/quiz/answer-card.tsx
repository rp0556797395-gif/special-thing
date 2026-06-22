"use client"

import { motion } from "framer-motion"

interface AnswerCardProps {
  index: number
  text: string
  isCorrect?: boolean
  isRevealed?: boolean
  percentage?: number
}

const cardColors = [
  { bg: "from-pink-500 to-rose-500", glow: "#ff4488", label: "1" },
  { bg: "from-cyan-500 to-blue-500", glow: "#00ccff", label: "2" },
  { bg: "from-green-500 to-emerald-500", glow: "#00ff88", label: "3" },
  { bg: "from-yellow-500 to-orange-500", glow: "#ffaa00", label: "4" },
]

export function AnswerCard({
  index,
  text,
  isCorrect = false,
  isRevealed = false,
  percentage = 0,
}: AnswerCardProps) {
  const color = cardColors[index] || cardColors[0]

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 50, rotateX: -30 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring" }}
      whileHover={!isRevealed ? { scale: 1.02, y: -5 } : undefined}
    >
      <motion.div
        className={`relative overflow-hidden rounded-2xl p-6 min-h-[120px] ${
          isRevealed && isCorrect ? "ring-4 ring-white" : ""
        }`}
        style={{
          background: `linear-gradient(135deg, ${color.bg.split(" ")[0].replace("from-", "")} 0%, ${color.bg.split(" ")[1].replace("to-", "")} 100%)`,
          boxShadow: isRevealed && isCorrect
            ? `0 0 40px ${color.glow}, 0 0 80px ${color.glow}`
            : `0 0 20px ${color.glow}40`,
        }}
        animate={
          isRevealed && isCorrect
            ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                  `0 0 40px ${color.glow}`,
                  `0 0 80px ${color.glow}`,
                  `0 0 40px ${color.glow}`,
                ],
              }
            : {}
        }
        transition={{
          duration: 0.5,
          repeat: isRevealed && isCorrect ? Infinity : 0,
        }}
      >
        {/* Card label */}
        <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-white font-bold text-xl">{color.label}</span>
        </div>

        {/* Answer text */}
        <div className="flex items-center justify-center min-h-[80px] px-4">
          <p className="text-white text-2xl md:text-3xl font-semibold text-center leading-tight">
            {text}
          </p>
        </div>

        {/* Percentage indicator when stats available */}
        {percentage > 0 && (
          <motion.div
            className="absolute bottom-2 right-3 bg-white/20 px-3 py-1 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            <span className="text-white font-bold">{percentage.toFixed(0)}%</span>
          </motion.div>
        )}

        {/* Correct answer checkmark */}
        {isRevealed && isCorrect && (
          <motion.div
            className="absolute top-3 right-3"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      </motion.div>
    </motion.div>
  )
}
