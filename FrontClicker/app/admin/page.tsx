"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AdminPanel } from "@/components/quiz/admin-panel"
import { FloatingShapes } from "@/components/quiz/floating-shapes"
import { QuizGame } from "@/components/quiz/quiz-game"

export default function AdminPage() {
  const [serverUrl, setServerUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080")
  const [password, setPassword] = useState("")
  
  // 1. ניהול המצבים החדש שלנו
  const [view, setView] = useState<'setup' | 'admin' | 'game'>('setup')
  const [isLoggedIn, setIsLoggedIn] = useState(false) // האם התחברנו בהצלחה?
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null) // הודעות למשתמש

  const [eventName, setEventName] = useState("Live Quiz")
  // 2. פונקציית ההתחברות (מטפלת רק באימות מול השרת)
  const handleLogin = async () => {
    setMessage(null) 

    Howler.stop(); 

    try {
      const response = await fetch(`${serverUrl}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()
      
      if (response.ok && data.token) {
        // התחברות מוצלחת!
        localStorage.setItem("adminToken", data.token)
        Howler.stop(); 

        setIsLoggedIn(true) // משנה את חזות הדף להצגת כפתורי הניווט
        setMessage({ type: 'success', text: 'התחברת בהצלחה! בחר לאן להמשיך:' })
      } else {
        // שגיאת התחברות (סיסמה לא נכונה)
        setMessage({ type: 'error', text: 'סיסמה שגויה, נסה שוב.' })
      }
    } catch (err) {
      // שגיאת רשת (השרת למטה או הכתובת לא נכונה)
      setMessage({ type: 'error', text: 'לא ניתן להתחבר לשרת. ודא שהוא פועל.' })
    }
  }

  // 3. פונקציות הניווט (מוודאות שהטוקן באמת קיים לפני המעבר)
  const goToAdminPanel = () => {
    if (localStorage.getItem("adminToken")) {
      setView('admin')
    } else {
      setMessage({ type: 'error', text: 'הטוקן חסר. עליך להתחבר שוב.' })
    }
  }

  const goToGame = () => {
    Howler.stop(); 
    
    if (localStorage.getItem("adminToken")) {
      setView('game')
    } else {
      setMessage({ type: 'error', text: 'הטוקן חסר. עליך להתחבר שוב.' })
    }
  }

  // ==========================================
  // רינדור המסכים
  // ==========================================

  // מסך א': שלב ההתחברות והבחירה
  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
        <FloatingShapes />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-3xl blur-2xl opacity-20" />
          
          <div className="relative glass rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <span className="text-5xl mb-4 block">⚙️</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
                System Admin
              </h1>
              <p className="text-muted-foreground mt-2">
                {isLoggedIn ? "Access Granted" : "Please login to continue"}
              </p>
            </div>

            {/* אזור הצגת הודעות (הצלחה/שגיאה) */}
            <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className={`p-3 mb-6 rounded-lg text-center font-medium ${
                    message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                    : 'bg-green-500/10 text-green-500 border border-green-500/20'
                  }`}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              {/* מציג את השדות רק אם המשתמש *לא* מחובר */}
              {!isLoggedIn ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Server URL</label>
                    <input
                      type="url"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Event Name</label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary outline-none" 
                    />
                    
                  </div>
                  
                  <motion.button
                    onClick={handleLogin}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Login
                  </motion.button>
                </>
              ) : (
                /* מציג את כפתורי הניווט רק *אחרי* שהמשתמש התחבר בהצלחה */
                <div className="space-y-4">
                  <motion.button
                    onClick={goToAdminPanel}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Enter Admin Panel
                  </motion.button>
                  
                  <motion.button
                    onClick={goToGame}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Enter Admin Game
                  </motion.button>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <a href="/" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 text-sm">
                ← Back to Quiz Game
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // מסך ב': פאנל ניהול השאלות
  if (view === 'admin') {
    return <AdminPanel serverUrl={serverUrl} />
  }

  // מסך ג': משחק הניהול
  if (view === 'game') {
    return <QuizGame serverUrl={serverUrl} eventName={eventName} />
  }

  return null
}