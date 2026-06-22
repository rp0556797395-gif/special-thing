"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"

export interface Question {
  id: number
  questionNumber?: number
  questionText: string
  answer1: string
  answer2: string
  answer3: string
  answer4: string
  correctAnswer: string
}

export interface QuestionStats {
  answer1: number
  answer2: number
  answer3: number
  answer4: number
}

export interface Participant {
  phoneNumber: string
  score: number
 
}

export interface GameStatus {
  status: "STARTED" | "WAITING" | "ENDED"
  question?: number
}

interface UseQuizWebSocketOptions {
  serverUrl: string
  onQuestion?: (question: Question) => void
  onStats?: (stats: QuestionStats) => void
  onLiveAnswer?: (answer: string) => void
  onLeaderboard?: (participants: Participant[]) => void
  onGameStatus?: (status: GameStatus) => void
}

export function useQuizWebSocket({
  serverUrl,
  onQuestion,
  onStats,
  onLiveAnswer,
  onLeaderboard,
  onGameStatus,
}: UseQuizWebSocketOptions) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${serverUrl}/ws-quiz`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true)
        console.log("WebSocket connected!")

        // Subscribe to game status (includes questions)
        client.subscribe("/topic/game-status", (message) => {
          const data = JSON.parse(message.body)
          if (data.status) {
            onGameStatus?.(data as GameStatus)
          } else if (data.questionText) {
            onQuestion?.(data as Question)
          }
        })

        // Subscribe to stats updates
        client.subscribe("/topic/stats", (message) => {
          const stats = JSON.parse(message.body)
          onStats?.(stats as QuestionStats)
        })

        // Subscribe to live answers
        client.subscribe("/topic/live-answers", (message) => {
          onLiveAnswer?.(message.body)
        })

        // Subscribe to leaderboard
        client.subscribe("/topic/leaderboard", (message) => {
          const participants = JSON.parse(message.body)
          onLeaderboard?.(participants as Participant[])
        })
      },
      onDisconnect: () => {
        setIsConnected(false)
        console.log("WebSocket disconnected")
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [serverUrl, onQuestion, onStats, onLiveAnswer, onLeaderboard, onGameStatus])

  return { isConnected }
}
