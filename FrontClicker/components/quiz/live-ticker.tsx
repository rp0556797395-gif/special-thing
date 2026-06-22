"use client"

import { motion, AnimatePresence } from "framer-motion"

interface LiveTickerProps {
  answers: string[]
}

export function LiveTicker({ answers }: LiveTickerProps) {
  // Show only last 20 answers
  const recentAnswers = answers.slice(-20)

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500/20 to-cyan-500/20 px-4 py-2">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
          Live Answers
        </span>
      </div>
      
      <div className="relative h-12 overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <motion.div
            className="flex gap-4 px-4"
            animate={{
              x: [0, -50 * recentAnswers.length],
            }}
            transition={{
              x: {
                duration: recentAnswers.length * 2,
                repeat: Infinity,
                ease: "linear",
              },
            }}
          >
            <AnimatePresence mode="popLayout">
              {recentAnswers.map((answer, idx) => {
                // Extract phone number from "PHONE answered: X" format
                const parts = answer.split(" answered: ")
                const phone = parts[0] || answer
                const answerValue = parts[1] || ""
                
                return (
                  <motion.div
                    key={`${answer}-${idx}`}
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 shrink-0"
                  >
                    <span className="text-xs text-muted-foreground font-mono">
                      {phone.slice(-4)}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                      {answerValue || "?"}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            
            {/* Duplicate for seamless loop */}
            {recentAnswers.map((answer, idx) => {
              const parts = answer.split(" answered: ")
              const phone = parts[0] || answer
              const answerValue = parts[1] || ""
              
              return (
                <div
                  key={`dup-${answer}-${idx}`}
                  className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 shrink-0"
                >
                  <span className="text-xs text-muted-foreground font-mono">
                    {phone.slice(-4)}
                  </span>
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                    {answerValue || "?"}
                  </span>
                </div>
              )
            })}
          </motion.div>
        </div>

        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10" />
      </div>
    </div>
  )
}
