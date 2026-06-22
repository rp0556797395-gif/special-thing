"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FloatingShapes } from "./floating-shapes"

interface SetupFormProps {
  onStart: (config: { serverUrl: string; eventName: string; adminKey: string }) => void
}

export function SetupForm({ onStart }: SetupFormProps) {
  const [serverUrl, setServerUrl] = useState("http://localhost:8080")
  const [eventName, setEventName] = useState("Quiz Night 2026")
  const [adminKey, setAdminKey] = useState("ADMIN123")
  const [isConnecting, setIsConnecting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)
    
    setTimeout(() => {
      onStart({ serverUrl, eventName, adminKey })
    }, 500)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ backgroundColor: "#f8f7ff" }}>
      {/* Background layer */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <FloatingShapes />
      </div>
      
      {/* Content layer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, duration: 0.5 }}
        className="relative w-full max-w-lg"
        style={{ zIndex: 50 }}
      >
        {/* Glow effect behind card */}
        <div 
          className="absolute inset-0 rounded-3xl blur-3xl"
          style={{ 
            background: "linear-gradient(135deg, rgba(236,72,153,0.3), rgba(6,182,212,0.3))",
            transform: "scale(1.1)"
          }} 
        />
        
        {/* Main card */}
        <div 
          className="relative rounded-3xl p-8 md:p-12 shadow-2xl"
          style={{ 
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.5)"
          }}
        >
          {/* Logo/Title */}
          <div className="text-center mb-10">
            <motion.div
              className="inline-block mb-6"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-7xl">🎯</span>
            </motion.div>
            <h1 
              className="text-4xl md:text-5xl font-black mb-3"
              style={{ 
                background: "linear-gradient(to right, #ec4899, #06b6d4, #eab308)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              Live Quiz
            </h1>
            <p style={{ color: "#6b7280", fontSize: "1.125rem" }}>
              Configure your game settings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Server URL */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: "#374151" }}
              >
                Server URL
              </label>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-4 py-4 rounded-xl text-lg outline-none transition-all"
                style={{ 
                  backgroundColor: "#f3f4f6",
                  border: "2px solid #e5e7eb",
                  color: "#1f2937"
                }}
                onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                placeholder="http://localhost:8080"
                required
              />
            </div>

            {/* Event Name */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: "#374151" }}
              >
                Event Name / Slogan
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-4 py-4 rounded-xl text-lg outline-none transition-all"
                style={{ 
                  backgroundColor: "#f3f4f6",
                  border: "2px solid #e5e7eb",
                  color: "#1f2937"
                }}
                onFocus={(e) => e.target.style.borderColor = "#06b6d4"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                placeholder="Quiz Night 2026"
                required
              />
            </div>

            {/* Admin Key */}
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: "#374151" }}
              >
                Admin Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-4 py-4 rounded-xl text-lg outline-none transition-all"
                style={{ 
                  backgroundColor: "#f3f4f6",
                  border: "2px solid #e5e7eb",
                  color: "#1f2937"
                }}
                onFocus={(e) => e.target.style.borderColor = "#eab308"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                placeholder="••••••••"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={isConnecting}
                className="w-full py-4 text-white font-bold rounded-xl text-xl relative overflow-hidden cursor-pointer"
                style={{ 
                  background: "linear-gradient(to right, #ec4899, #06b6d4)",
                  boxShadow: "0 0 30px rgba(236,72,153,0.4)"
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-3">
                    <motion.span
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Connecting...
                  </span>
                ) : (
                  "Start Quiz Game"
                )}
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    background: "linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent)"
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.button>
            </div>
          </form>

          {/* Admin link */}
          <div className="mt-8 text-center">
            <a
              href="/admin"
              className="underline underline-offset-4 transition-colors"
              style={{ color: "#6b7280" }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#374151"}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#6b7280"}
            >
              Manage Questions →
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
