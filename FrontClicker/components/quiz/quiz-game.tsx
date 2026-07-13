"use client"
import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Howl, Howler } from "howler"
import { Play, Pause, SkipForward, Trophy, Zap, ZapOff } from "lucide-react"
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
  // ⏱️ משך השאלה חייב להתאים למה שהשרת שולח ל-quizTimerService.startTimer(...)
  const QUESTION_SECONDS = 20

  const [activeEventName, setActiveEventName] = useState(initialEventName)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [stats, setStats] = useState<QuestionStats>({ answer1: 0, answer2: 0, answer3: 0, answer4: 0 })
  const [liveAnswers, setLiveAnswers] = useState<string[]>([])
  const [leaderboard, setLeaderboard] = useState<Participant[]>([])
  
  const [isTimerActive, setIsTimerActive] = useState(false)
  // ⏱️ הזמן הנותר בפועל - מגיע אך ורק משידור /topic/timer של השרת (QuizTimerService).
  // זהו מקור האמת היחיד, ולכן זהה במדויק אצל המנהל וכל המשתתפים בכל רגע נתון
  const [timeLeft, setTimeLeft] = useState(QUESTION_SECONDS)
  const [isRevealed, setIsRevealed] = useState(false)
  const [showWinner, setShowWinner] = useState(false)
  const [showBurst, setShowBurst] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  // ⏸️ מצב השהיה גלובלי - מגיע מה-WebSocket, ולכן זהה במדויק אצל המנהל וכל המשתתפים
  const [isPaused, setIsPaused] = useState(false)
  
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
  const requestShowWinnerRef = useRef<(() => void) | null>(null)
  const triggerWinnerOverlayRef = useRef<(() => void) | null>(null)
  const handleTimerCompleteRef = useRef<(() => void) | null>(null)

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
    setTimeLeft(QUESTION_SECONDS)
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
  
  // 🔄 סטטוס המשחק - כולל עכשיו גם PAUSED/RESUMED, ולכן משפיע באותו רגע
  // על כל מי שמחובר ל-WebSocket הזה (מנהל ומשתתפים כאחד)
  const handleGameStatus = useCallback((status: { status: string, eventName?: string }) => {
    if (!isMountedRef.current) return;
    if (status.status === "STARTED") setGameStarted(true)
    if (status.status === "PAUSED") setIsPaused(true)
    if (status.status === "RESUMED") setIsPaused(false)
    if (status.eventName && status.eventName !== activeEventName) {
      setActiveEventName(status.eventName)
    }
  }, [activeEventName])

  // ⏱️ מגיע ישירות משידור /topic/timer של השרת - מקור האמת היחיד לזמן הנותר.
  // "TIME_UP" מגיע כשה-QuizTimerService בשרת מסיים את הספירה בפועל
  const handleTimerTick = useCallback((value: number | "TIME_UP") => {
    if (!isMountedRef.current) return;
    if (value === "TIME_UP") {
      handleTimerCompleteRef.current?.()
    } else {
      setTimeLeft(value)
    }
  }, [])

  // 🏆 עטוף ב-useCallback עם תלויות ריקות כדי שתהיה לו זהות יציבה בין רינדורים -
  // אחרת ה-useEffect בתוך useQuizWebSocket "רואה" פונקציה חדשה בכל רינדור ומחבר מחדש את ה-WebSocket כל הזמן
  const handleWinner = useCallback(() => {
    triggerWinnerOverlayRef.current?.()
  }, [])

  const { isConnected } = useQuizWebSocket({
    serverUrl, onQuestion: handleQuestion, onStats: handleStats, onLiveAnswer: handleLiveAnswer,
    onLeaderboard: handleLeaderboard, onGameStatus: handleGameStatus,
    onTimerTick: handleTimerTick,
    onWinner: handleWinner,
  })

  // ⏸️ עצירת/המשך המוזיקה בהתאם למצב ההשהיה הגלובלי (רץ אצל כולם)
  useEffect(() => {
    if (!isMountedRef.current) return;
    if (isPaused) {
      bgMusicRef.current?.pause()
    } else if (isTimerActive) {
      bgMusicRef.current?.play()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused])

  // === פונקציית קידום שאלה ===
  const nextQuestion = async () => {
    if (isProcessing || !isAdmin || !isMountedRef.current || isPaused) return
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

  // === פונקציית מנצח (צד המנהל בלבד) ===
  // לוחצים -> רק מבקשים מהשרת לשדר SHOW ל-/topic/winner לכולם. אין כאן קביעת state מקומי,
  // כדי שהתצוגה תיפתח אצל המנהל ואצל כל המשתתפים באותו רגע בדיוק (ראה triggerWinnerOverlay למטה)
  const requestShowWinner = async () => {
    if (!isAdmin || !isMountedRef.current || isPaused) return
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current)

    try {
      const token = localStorage.getItem("adminToken") ?? "admin"
      // ה-endpoint האמיתי הוא /api/quiz/show-winner (בלי /admin) ודורש פרמטר key בשאילתה
      const response = await fetchWithAuth(`${serverUrl}/api/quiz/admin/show-winner?key=${encodeURIComponent(token)}`);
      if (!response.ok) {
        alert("לא ניתן להציג את המנצח")
      }
      // התצוגה בפועל תיפתח אצל כולם (כולל המנהל עצמו) כשיגיע שידור
      // "SHOW" דרך /topic/winner, ולא כאן
    } catch (error) {
      console.error(error)
    }
  }

  // === פונקציית מנצח (רצה אצל כולם: מנהל + משתתפים) ===
  // מופעלת אך ורק כתגובה לשידור SHOW_WINNER מה-WebSocket, כדי שכולם יראו את המנצח
  // באותו רגע בדיוק. משתמשת ב-leaderboard שכבר מסונכרן לכולם דרך onLeaderboard,
  // כך שאין צורך בקריאת REST נוספת (וגם למשתתפים, שאין להם טוקן אדמין, יש גישה לתצוגה)
  const triggerWinnerOverlay = useCallback(() => {
    if (!isMountedRef.current) return
    bgMusicRef.current?.stop(); Howler.stop();

    setShowWinner(true)
    applauseSoundRef.current?.play()

    // ⏱️ 2 שניות נוספות למתן זמן לצפות במנצח על המסך לפני שממשיכים
    setTimeout(() => {
      if (!isMountedRef.current) return;
      setShowWinner(false);
      if (isAdmin && isAutoModeRef.current) nextQuestionRef.current?.()
    }, 5000)
  }, [isAdmin])

  // === פונקציית השהיה/המשך - שולחת פקודה לשרת, שמשדר PAUSED/RESUMED לכולם ===
  const togglePause = async () => {
    if (!isAdmin || !isMountedRef.current) return
    try {
      const endpoint = isPaused ? "resume" : "pause"
      const response = await fetchWithAuth(`${serverUrl}/api/quiz/admin/${endpoint}`);
      if (!response.ok) {
        alert("לא ניתן היה לעדכן את מצב ההשהיה")
        return
      }
      // המצב בפועל (isPaused) יתעדכן אצל כולם כשיגיע שידור ה-status מה-WebSocket,
      // כך שההשהיה קורית באותו רגע בדיוק אצל המנהל וכל המשתתפים
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    nextQuestionRef.current = nextQuestion
    requestShowWinnerRef.current = requestShowWinner
    triggerWinnerOverlayRef.current = triggerWinnerOverlay
    handleTimerCompleteRef.current = handleTimerComplete
  })

  // מופעלת כשמגיע "TIME_UP" משידור /topic/timer של השרת - כלומר הזמן באמת נגמר בשרת,
  // ולכן קורה אצל כולם (מנהל ומשתתפים) באותו רגע בדיוק
  const handleTimerComplete = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsTimerActive(false)
    setIsRevealed(true)
    setShowBurst(true)
    bgMusicRef.current?.stop()
    buzzerSoundRef.current?.play()

    if (isAutoModeRef.current && isAdmin) {
      // ⏱️ 2 שניות נוספות למתן זמן לצפות בתשובה הנכונה על המסך לפני שממשיכים
      autoTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (questionsCounterRef.current > 0 && questionsCounterRef.current % 5 === 0) {
          requestShowWinnerRef.current?.()
        } else {
          nextQuestionRef.current?.()
        }
      }, 6000)
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

        {/* 🔔 באנר השהיה - מוצג לכולם (מנהל ומשתתפים) כשהמשחק מושהה */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-500/20 border border-yellow-400/40 backdrop-blur-md shadow-lg"
            >
              <Pause className="w-4 h-4 text-yellow-100" />
              <span className="text-sm font-bold text-yellow-100 tracking-wide">המשחק מושהה</span>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <Timer totalSeconds={QUESTION_SECONDS} timeLeft={timeLeft} isPaused={isPaused} key={questionNumber} />
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

        {/* 🎛️ פאנל השליטה - צבעים זוהרים וברורים, מצב מופעל/כבוי בולט לעין */}
        {isAdmin && (
          <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col items-center gap-3 bg-black/40 p-3 rounded-[2rem] backdrop-blur-xl border border-white/10 shadow-2xl">
            {!gameStarted ? (
              <button
                onClick={startGame}
                title="התחל משחק"
                className="group w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-green-400 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.8)] ring-2 ring-green-300/60"
              >
                <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
              </button>
            ) : (
              <div className="flex flex-col gap-3 items-center">
                {/* ⏸️ השהיה/המשך - צהוב זוהר ובולט כשמושהה, כחול-אפור רגוע כשפעיל */}
                <button
                  onClick={togglePause}
                  title={isPaused ? "המשך משחק" : "השהה משחק"}
                  className={`group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isPaused
                      ? "bg-yellow-400 text-black shadow-[0_0_22px_rgba(250,204,21,0.9)] ring-2 ring-yellow-200/70 animate-pulse"
                      : "bg-slate-700/70 text-slate-200 border border-white/10 hover:bg-slate-600/80 shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                  }`}
                >
                  {isPaused ? (
                    <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                  ) : (
                    <Pause className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                  )}
                </button>

                {/* 🔁 מצב אוטומטי/ידני - סגול-פוקסיה זוהר כשאוטומטי, אפור עמום כשידני */}
                <button
                  onClick={() => setIsAutoMode(!isAutoMode)}
                  title={isAutoMode ? "מצב אוטומטי (לחץ למעבר לידני)" : "מצב ידני (לחץ למעבר לאוטומטי)"}
                  className={`group w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isAutoMode
                      ? "bg-fuchsia-500 text-white shadow-[0_0_22px_rgba(217,70,239,0.85)] ring-2 ring-fuchsia-300/70"
                      : "bg-slate-700/70 text-slate-300 border border-white/10 hover:bg-slate-600/80 shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                  }`}
                >
                  {isAutoMode ? (
                    <Zap className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                  ) : (
                    <ZapOff className="w-5 h-5 transition-transform group-hover:scale-110" />
                  )}
                </button>

                {/* ⏭️ שאלה הבאה - כחול-ציאן זוהר, תמיד פעיל כשהמשחק לא מושהה */}
                <button
                  onClick={nextQuestion}
                  disabled={isProcessing || isPaused}
                  title="שאלה הבאה"
                  className="group w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-cyan-400 active:scale-95 shadow-[0_0_20px_rgba(34,211,238,0.8)] ring-2 ring-cyan-300/60 disabled:opacity-25 disabled:shadow-none disabled:ring-0 disabled:hover:scale-100"
                >
                  <SkipForward className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
                </button>

                {/* 🏆 הצגת מנצח - ורוד זוהר, תמיד בולט כשזמין */}
                <button
                  onClick={requestShowWinner}
                  disabled={isPaused}
                  title="הצג מנצח"
                  className="group w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-pink-400 active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.8)] ring-2 ring-pink-300/60 disabled:opacity-25 disabled:shadow-none disabled:ring-0 disabled:hover:scale-100"
                >
                  <Trophy className="w-5 h-5 transition-transform group-hover:scale-110" />
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