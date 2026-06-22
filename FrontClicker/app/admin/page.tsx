"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AdminPanel } from "@/components/quiz/admin-panel"
import { FloatingShapes } from "@/components/quiz/floating-shapes"

export default function AdminPage() {
  const [serverUrl, setServerUrl] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
        <FloatingShapes />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
          
          <div className="relative glass rounded-3xl p-8">
            <div className="text-center mb-8">
              <span className="text-5xl mb-4 block">⚙️</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-muted-foreground mt-2">
                Enter your server URL to manage questions
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                setIsConfigured(true)
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Server URL
                </label>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary outline-none"
                   placeholder={serverUrl}
                  required
                />
              </div>

              <motion.button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Enter Admin Panel
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                ← Back to Quiz Game
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return <AdminPanel serverUrl={serverUrl} />
}
