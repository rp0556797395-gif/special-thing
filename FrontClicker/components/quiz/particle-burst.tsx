"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface ParticleBurstProps {
  trigger: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  angle: number
  velocity: number
}

const colors = ["#ff4488", "#00ccff", "#00ff88", "#ffaa00", "#ff00ff", "#ffffff"]

export function ParticleBurst({ trigger, onComplete }: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = []
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: 50,
          y: 50,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 12 + 4,
          angle: (Math.PI * 2 * i) / 50,
          velocity: Math.random() * 300 + 200,
        })
      }
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => {
          const endX = 50 + Math.cos(particle.angle) * particle.velocity
          const endY = 50 + Math.sin(particle.angle) * particle.velocity

          return (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              }}
              initial={{
                scale: 0,
                x: "-50%",
                y: "-50%",
              }}
              animate={{
                scale: [0, 1.5, 0],
                x: [`-50%`, `calc(${endX - 50}vw - 50%)`],
                y: [`-50%`, `calc(${endY - 50}vh - 50%)`],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
