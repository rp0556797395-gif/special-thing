"use client"
import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Howl, Howler } from "howler"
import { FloatingShapes } from "./floating-shapes"
import { Timer } from "./timer"
import { QuestionDisplay } from "./question-display"
import { LiveTicker } from "./live-ticker"
import { WinnerOverlay } from "./winner-overlay"
import { EventMarquee } from "./event-marquee"
import { ParticleBurst } from "./particle-burst"
import { useQuizWebSocket, type Question, type QuestionStats, type Participant } from "@/hooks/use-quiz-websocket"

// 💣 פצצת אטום גלובלית לריענונים קשיחים של Next.js (מחוץ לריאקט)
if (typeof window !== "undefined") {
  Howler.unload();
}

interface QuizGameProps {
  serverUrl: string
  eventName?: string 
}

export function QuizGame({ serverUrl, eventName: initialEventName = "Live Quiz" }: QuizGameProps) {
  const [activeEventName, setActiveEventName] = useState(initialEventName)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [stats, setStats] = useState<QuestionStats>({ answer1: 0, answer2: 0, answer3: 0, answer4: 0 })
  const [liveAnswers, setLiveAnswers] = useState<string[]>([])
  const [leaderboard, setLeaderboard] = useState<Participant[]>([])
  
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 🛡️ שומר הסף הרמטי - מונע מאירועי זומבי לנגן סאונד כשהדף לא פעיל
  const isMountedRef = useRef(true)

  useEffect(() => {
    const token = localStorage.getItem("adminToken")
    if (token) setIsAdmin(true)
  }, [])

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("adminToken");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return await fetch(url, { ...options, headers });
  };

  // Audio refs
  const tickSoundRef = useRef<Howl | null>(null)
  const buzzerSoundRef = useRef<Howl | null>(null)
  const applauseSoundRef = useRef<Howl | null>(null)
  const bgMusicRef = useRef<Howl | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null)
  const questionsCounterRef = useRef(0)
  
  const isAutoModeRef = useRef(isAutoMode)
  const nextQuestionRef = useRef<(() => void) | null>(null)
  const handleShowWinnerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    isAutoModeRef.current = isAutoMode
    if (!isAutoMode && autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }, [isAutoMode])

  // =======================================================
  // ⛔ ניהול אודיו קשוח וניקוי מוחלט
  // =======================================================
  useEffect(() => {
    isMountedRef.current = true; 
    Howler.unload(); 

    const tick = new Howl({ src: ["/audio/tt.mp3"], volume: 0.3 })
    const buzzer = new Howl({ src: ["/audio/buzzer.mp3"], volume: 0.5 })
    const applause = new Howl({ src: ["/audio/applause.mp3"], volume: 0.6 })
    const bgMusic = new Howl({ src: ["/audio/bg-music.mp3"], volume: 0.2, loop: true })

    tickSoundRef.current = tick;
    buzzerSoundRef.current = buzzer;
    applauseSoundRef.current = applause;
    bgMusicRef.current = bgMusic;

    const killAllAudio = () => {
      bgMusic.stop(); tick.stop(); buzzer.stop(); applause.stop();
      bgMusic.unload(); tick.unload(); buzzer.unload(); applause.unload();
      Howler.stop(); Howler.unload();
    };

    window.addEventListener("beforeunload", killAllAudio);
    window.addEventListener("popstate", killAllAudio);

    return () => {
      isMountedRef.current = false; 
      window.removeEventListener("beforeunload", killAllAudio);
      window.removeEventListener("popstate", killAllAudio);
      killAllAudio();
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleQuestion = useCallback((question: Question) => {
    if (!isMountedRef.current) return; 

    bgMusicRef.current?.stop();
    tickSoundRef.current?.stop();
    buzzerSoundRef.current?.stop();
    Howler.stop(); 

    setCurrentQuestion(question)
    setQuestionNumber((prev) => prev + 1)
    setStats({ answer1: 0, answer2: 0, answer3: 0, answer4: 0 })
    setIsRevealed(false)
    setIsTimerActive(true)
    setShowBurst(true)
    
    bgMusicRef.current?.play()
  }, [])

  const handleStats = useCallback((newStats: QuestionStats) => {
    if (!isMountedRef.current) return;
    setStats(newStats)
  }, [])

  const handleLiveAnswer = useCallback((answer: string) => {
    if (!isMountedRef.current) return;
    setLiveAnswers((prev) => [...prev.slice(-50), answer])
    tickSoundRef.current?.play()
  }, [])

  const handleLeaderboard = useCallback((participants: Participant[]) => {
    if (!isMountedRef.current) return;
    setLeaderboard(participants.sort((a, b) => b.score - a.score).slice(0, 10))
  }, [])
  
  const handleGameStatus = useCallback((status: { status: string, eventName?: string }) => {
    if (!isMountedRef.current) return;
    if (status.status === "STARTED") setGameStarted(true)
    if (status.eventName && status.eventName !== activeEventName) {
      setActiveEventName(status.eventName)
    }
  }, [activeEventName])

  const { isConnected } = useQuizWebSocket({
    serverUrl, onQuestion: handleQuestion, onStats: handleStats, onLiveAnswer: handleLiveAnswer,
    onLeaderboard: handleLeaderboard, onGameStatus: handleGameStatus,
  })

  // === פונקציית קידום שאלה ===
  const nextQuestion = async () => {
    if (isProcessing || !isAdmin || !isMountedRef.current) return
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current) 

    bgMusicRef.current?.stop();
    Howler.stop(); 

    setIsProcessing(true)
    try {
      const response = await fetchWithAuth(`${serverUrl}/api/quiz/admin/next`);
      if (!response.ok) {
        alert("המשחק הסתיים או שהשרת לא זמין")
        setGameStarted(false)
        setIsProcessing(false)
        return
      }
      questionsCounterRef.current++
    } catch (error) {
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  // === פונקציית מנצח ===
  const handleShowWinner = async () => {
    if (!isAdmin || !isMountedRef.current) return
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current) 

    bgMusicRef.current?.stop(); Howler.stop();

    try {
      const response = await fetchWithAuth(`${serverUrl}/api/quiz/leaderboard`);
      if (!response.ok) throw new Error();
      let data = await response.json();
      if (data && !Array.isArray(data)) data = [data];
      
      if (data && data.length > 0) {
        const sortedData = data.sort((a: any, b: any) => b.score - a.score)
        setLeaderboard(sortedData)
        setShowWinner(true)
        applauseSoundRef.current?.play()

        setTimeout(() => {
          if (!isMountedRef.current) return;
          setShowWinner(false); 
          if (isAutoModeRef.current) nextQuestionRef.current?.()
        }, 3000)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    nextQuestionRef.current = nextQuestion
    handleShowWinnerRef.current = handleShowWinner
  })

  const handleTimerComplete = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsTimerActive(false)
    setIsRevealed(true)
    setShowBurst(true)
    bgMusicRef.current?.stop()
    buzzerSoundRef.current?.play()

    if (isAutoModeRef.current && isAdmin) {
      autoTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (questionsCounterRef.current > 0 && questionsCounterRef.current % 5 === 0) {
          handleShowWinnerRef.current?.()
        } else {
          nextQuestionRef.current?.()
        }
      }, 4000)
    }
  }, [isAdmin])

  // === התחלת משחק ===
  const startGame = async () => {
    if (!isAdmin || !isMountedRef.current) return
    try {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
      questionsCounterRef.current = 0
      bgMusicRef.current?.stop(); Howler.stop(); 
      
      await fetchWithAuth(`${serverUrl}/api/quiz/admin/start`);
      setGameStarted(true)
      nextQuestion()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="h-screen bg-background relative overflow-hidden flex flex-col">
      <FloatingShapes />
      <ParticleBurst trigger={showBurst} onComplete={() => setShowBurst(false)} />

      <div className="relative z-10 flex flex-col h-full">
        <div className="pt-0.5 shrink-0">
          <EventMarquee eventName={activeEventName} />
        </div>

        <div className="fixed top-2 right-4 z-50 scale-90">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full glass ${isConnected ? "text-green-500" : "text-red-500"}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs font-medium">{isConnected ? "Live" : "Connecting..."}</span>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-4 flex items-start overflow-hidden">
          <div className="flex flex-row gap-8 w-full items-stretch h-[88vh] -mt-15">
            <div className="flex-[3] flex flex-col justify-start pt-1">
              <div id="force-black-text" className="w-full">
                <style>{`#force-black-text *, #force-black-text p, #force-black-text span, #force-black-text div { color: #000000 !important; opacity: 1 !important; }`}</style>
                <QuestionDisplay question={currentQuestion} stats={stats} isRevealed={isRevealed} questionNumber={questionNumber} />
              </div>
            </div>

            <div className="flex-1 max-w-[300px] flex flex-col gap-4 py-1 ml-auto">
              <div className="pt-16 flex flex-col gap-4">
                <div className="relative inline-flex items-center justify-center scale-90">
                  <Timer seconds={20} isActive={isTimerActive} onComplete={handleTimerComplete} key={questionNumber} />
                </div>
              </div>

              <div className="flex-1 glass rounded-[2.5rem] p-6 flex flex-col shadow-2xl border border-white/10 overflow-hidden">
                <h3 className="text-2xl font-bold text-center text-slate-800 mb-2">Live Responses</h3>
                <p className="text-center text-slate-500 text-sm mb-6">{stats.answer1 + stats.answer2 + stats.answer3 + stats.answer4} answers</p>
                <div id="main-question-area" className="w-full">
                  <style>{`#force-black-text, #force-black-text *, #force-black-text p, #force-black-text span, #force-black-text h1, #force-black-text h2, #force-black-text div { color: #000000 !important; opacity: 1 !important; }`}</style>  
                  <div className="flex flex-col gap-4 justify-center mt-4">
                    {[
                      { id: 1, label: '1', color: 'from-pink-500 to-rose-500' },
                      { id: 2, label: '2', color: 'from-blue-500 to-cyan-500' },
                      { id: 3, label: '3', color: 'from-emerald-500 to-teal-500' },
                      { id: 4, label: '4', color: 'from-orange-500 to-amber-500' }
                    ].map((item) => {
                      const key = `answer${item.id}` as keyof QuestionStats;
                      const total = stats.answer1 + stats.answer2 + stats.answer3 + stats.answer4;
                      const count = stats[key];
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={item.id} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}>{item.label}</div>
                          <div className="flex-1 h-10 bg-slate-100/40 rounded-full relative overflow-hidden border border-slate-200/30">
                            <motion.div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.color} opacity-25`} initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8 }} />
                            <div className="absolute inset-0 flex items-center justify-end px-4 font-bold text-slate-700 text-base">{count} ({percentage}%)</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-4 shrink-0">
          <LiveTicker answers={liveAnswers} />
        </div>

        {/* פאנל השליטה העדין */}
        {isAdmin && (
          <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-3 bg-black/20 p-2.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
            {!gameStarted ? (
              <button onClick={startGame} className="w-10 h-10 rounded-full bg-green-500/20 hover:bg-green-500/40 border border-green-500/30 text-green-100 flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]" title="Start Game">
                <span className="text-[10px] font-bold tracking-wider">GO</span>
              </button>
            ) : (
              <div className="flex flex-col gap-3 items-center">
                <button onClick={() => setIsAutoMode(!isAutoMode)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${isAutoMode ? "bg-yellow-500/20 hover:bg-yellow-500/40 border-yellow-500/30 text-yellow-100 hover:shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "bg-white/5 hover:bg-white/15 border-white/10 text-slate-400"}`} title="Toggle Auto/Manual Mode">
                  <span className="text-[9px] font-bold tracking-wider">{isAutoMode ? "AUTO" : "MANU"}</span>
                </button>
                <button onClick={nextQuestion} disabled={isProcessing} className="w-10 h-10 rounded-full bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/30 text-blue-100 flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] disabled:opacity-30 disabled:hover:shadow-none" title="Next Question">
                  <span className="text-[9px] font-bold tracking-wider">NEXT</span>
                </button>
                <button onClick={handleShowWinner} className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 text-purple-100 flex items-center justify-center transition-all duration-300 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)]" title="Show Winner">
                  <span className="text-[9px] font-bold tracking-wider">WIN</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWinner && leaderboard[0] && <WinnerOverlay winner={leaderboard[0]} onClose={() => setShowWinner(false)} />}
      </AnimatePresence>
    </div>
  )
}