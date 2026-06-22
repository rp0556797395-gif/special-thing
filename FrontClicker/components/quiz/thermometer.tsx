"use client"

import { motion } from "framer-motion"

interface ThermometerProps {
  stats: {
    answer1: number
    answer2: number
    answer3: number
    answer4: number
  }
}

const segments = [
  { key: "answer1", label: "A", color: "from-pink-500 to-rose-500", glow: "#ff4488" },
  { key: "answer2", label: "B", color: "from-cyan-500 to-blue-500", glow: "#00ccff" },
  { key: "answer3", label: "C", color: "from-green-500 to-emerald-500", glow: "#00ff88" },
  { key: "answer4", label: "D", color: "from-yellow-500 to-orange-500", glow: "#ffaa00" },
]

export function Thermometer({ stats }: ThermometerProps) {
  const total = stats.answer1 + stats.answer2 + stats.answer3 + stats.answer4
  const percentages = {
    answer1: total > 0 ? (stats.answer1 / total) * 100 : 0,
    answer2: total > 0 ? (stats.answer2 / total) * 100 : 0,
    answer3: total > 0 ? (stats.answer3 / total) * 100 : 0,
    answer4: total > 0 ? (stats.answer4 / total) * 100 : 0,
  }

  return (
    <div className="glass rounded-3xl p-6 h-full">
      <h3 className="text-xl font-bold text-foreground mb-4 text-center">
        Live Responses
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-6">
        {total} total answers
      </p>

      <div className="flex flex-col gap-4">
        {segments.map((segment) => {
          const percentage = percentages[segment.key as keyof typeof percentages]
          const count = stats[segment.key as keyof typeof stats]

          return (
            <div key={segment.key} className="flex items-center gap-3">
              {/* Label */}
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${segment.color} flex items-center justify-center shrink-0`}
                style={{ boxShadow: `0 0 15px ${segment.glow}50` }}
              >
                <span className="text-white font-bold">{segment.label}</span>
              </div>

              {/* Bar container */}
              <div className="flex-1 h-10 bg-muted/50 rounded-full overflow-hidden relative">
                <motion.div
                  className={`h-full bg-gradient-to-r ${segment.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(percentage, 2)}%` }}
                  transition={{ duration: 0.5, type: "spring" }}
                  style={{ boxShadow: `0 0 20px ${segment.glow}` }}
                />
                
                {/* Count badge */}
                <motion.div
                  className="absolute inset-y-0 right-2 flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-foreground font-semibold text-sm">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Visual thermometer */}
      <div className="mt-8 flex justify-center">
        <div className="relative w-12 h-64 bg-muted/30 rounded-full overflow-hidden border-4 border-white/20">
          {/* Stacked segments */}
          {segments.slice().reverse().map((segment, idx) => {
            const percentage = percentages[segment.key as keyof typeof percentages]
            const previousHeights = segments
              .slice(0, 3 - idx)
              .reduce((acc, seg) => acc + percentages[seg.key as keyof typeof percentages], 0)

            return (
              <motion.div
                key={segment.key}
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${segment.color}`}
                style={{ boxShadow: `0 0 15px ${segment.glow}` }}
                initial={{ height: 0 }}
                animate={{ height: `${previousHeights}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, type: "spring" }}
              />
            )
          })}
          
          {/* Bulb at bottom */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 border-4 border-white/20" 
               style={{ boxShadow: "0 0 30px rgba(255,100,100,0.5)" }} />
        </div>
      </div>
    </div>
  )
}
