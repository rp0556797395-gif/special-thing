"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const [serverUrl, setServerUrl] = useState("http://localhost:8080")
  const [eventName, setEventName] = useState("QUIZ NIGHT 2025")
  const [eventSlogan, setEventSlogan] = useState("Test Your Knowledge!")
  const [adminKey, setAdminKey] = useState("")

  const handleStartGame = () => {
    const params = new URLSearchParams({
      server: serverUrl,
      event: eventName,
      slogan: eventSlogan,
    })
    router.push("http://localhost:3000/game?server=http%3A%2F%2Flocalhost%3A8080&event=QUIZ+NIGHT&slogan=Test+Your+Knowledge&adminKey=ADMIN123")
  }

  const handleAdminPanel = () => {
    if (!adminKey.trim()) {
      alert("Please enter the Admin Key")
      return
    }
    const params = new URLSearchParams({
      server: serverUrl,
      key: adminKey,
    })
    router.push(`/admin?${params.toString()}`)
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* BACKGROUND - Fixed, behind everything */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
          overflow: "hidden",
        }}
      >
        {/* Rotating light rays */}
        <div
          style={{
            position: "absolute",
            inset: "-50%",
            background: "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.1) 10%, transparent 20%)",
            animation: "spin 20s linear infinite",
          }}
        />
        {/* Floating circles */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "60%",
            right: "15%",
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20%",
            left: "20%",
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            animation: "float 7s ease-in-out infinite",
          }}
        />
      </div>

      {/* MAIN CONTAINER - Centered content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
        }}
      >
        {/* MASSIVE WHITE CARD */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: 24,
            padding: 48,
            width: "100%",
            maxWidth: 500,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              textAlign: "center",
              marginBottom: 8,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            LIVE QUIZ SETUP
          </h1>
          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginBottom: 32,
              fontSize: 16,
            }}
          >
            Configure your quiz game settings
          </p>

          {/* Form Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Server URL */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Server URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8080"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 16,
                  border: "2px solid #e0e0e0",
                  borderRadius: 12,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Event Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="QUIZ NIGHT 2025"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 16,
                  border: "2px solid #e0e0e0",
                  borderRadius: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Event Slogan */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Event Slogan
              </label>
              <input
                type="text"
                value={eventSlogan}
                onChange={(e) => setEventSlogan(e.target.value)}
                placeholder="Test Your Knowledge!"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 16,
                  border: "2px solid #e0e0e0",
                  borderRadius: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Admin Key */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#333",
                  marginBottom: 8,
                }}
              >
                Admin Key (for admin panel)
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key..."
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  fontSize: 16,
                  border: "2px solid #e0e0e0",
                  borderRadius: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* HUGE BUTTONS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
            <button
              onClick={handleStartGame}
              style={{
                width: "100%",
                padding: "20px 32px",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: 16,
                cursor: "pointer",
                boxShadow: "0 10px 40px -10px rgba(102, 126, 234, 0.5)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.02)"
                e.currentTarget.style.boxShadow = "0 15px 50px -10px rgba(102, 126, 234, 0.6)"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)"
                e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(102, 126, 234, 0.5)"
              }}
            >
              START GAME
            </button>

            <button
              onClick={handleAdminPanel}
              style={{
                width: "100%",
                padding: "20px 32px",
                fontSize: 20,
                fontWeight: 700,
                color: "#667eea",
                background: "#fff",
                border: "3px solid #667eea",
                borderRadius: 16,
                cursor: "pointer",
                transition: "transform 0.2s, background 0.2s, color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.02)"
                e.currentTarget.style.background = "#667eea"
                e.currentTarget.style.color = "#fff"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)"
                e.currentTarget.style.background = "#fff"
                e.currentTarget.style.color = "#667eea"
              }}
            >
              ADMIN PANEL
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
      `}</style>
    </div>
  )
}
