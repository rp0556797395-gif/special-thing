"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Howl } from "howler"
import { FloatingShapes } from "./floating-shapes"
import { Timer } from "./timer"
import { QuestionDisplay } from "./question-display"
import { Thermometer } from "./thermometer"
import { LiveTicker } from "./live-ticker"
import { WinnerOverlay } from "./winner-overlay"
import { EventMarquee } from "./event-marquee"
import { ParticleBurst } from "./particle-burst"
import { useQuizWebSocket, type Question, type QuestionStats, type Participant } from "@/hooks/use-quiz-websocket"

interface QuizGameProps {
  serverUrl: string
  eventName: string
  eventSlogan: string; // השורה הזו חסרה לך וגורמת לשגיאה
  adminKey?: string
}
export function QuizGame({ serverUrl, eventName,eventSlogan, adminKey }: QuizGameProps) {
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

  // Audio refs
  const tickSoundRef = useRef<Howl | null>(null)
  const buzzerSoundRef = useRef<Howl | null>(null)
  const applauseSoundRef = useRef<Howl | null>(null)
  const bgMusicRef = useRef<Howl | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null);
//const questionsCounterRef = useRef(0); // עדיף מ-let בחוץ
  
  // Initialize sounds
  useEffect(() => {
    tickSoundRef.current = new Howl({
      src: ["/audio/tt.mp3"],
      volume: 0.3,
    })
    buzzerSoundRef.current = new Howl({
      src: ["/audio/buzzer.mp3"],
      volume: 0.5,
    })
    applauseSoundRef.current = new Howl({
      src: ["/audio/applause.mp3"],
      volume: 0.6,
    })
    bgMusicRef.current = new Howl({
      src: ["/audio/bg-music.mp3"],
      volume: 0.2,
      loop: true,
    })

    return () => {
      tickSoundRef.current?.unload()
      buzzerSoundRef.current?.unload()
      applauseSoundRef.current?.unload()
      bgMusicRef.current?.unload()
    }
  }, [])

  const handleQuestion = useCallback((question: Question) => {
    setCurrentQuestion(question)
    setQuestionNumber((prev) => prev + 1)
    setStats({ answer1: 0, answer2: 0, answer3: 0, answer4: 0 })
    setIsRevealed(false)
    setIsTimerActive(true)
    setShowBurst(true)
    
    // Start background music when question arrives
    bgMusicRef.current?.play()
  }, [])

  const handleStats = useCallback((newStats: QuestionStats) => {
    setStats(newStats)
  }, [])

  const handleLiveAnswer = useCallback((answer: string) => {
    setLiveAnswers((prev) => [...prev.slice(-50), answer])
    tickSoundRef.current?.play()
  }, [])

  const handleLeaderboard = useCallback((participants: Participant[]) => {
    setLeaderboard(participants.sort((a, b) => b.score - a.score).slice(0, 10))
  }, [])

  const handleGameStatus = useCallback((status: { status: string }) => {
    if (status.status === "STARTED") {
      setGameStarted(true)
    }
  }, [])

  const { isConnected } = useQuizWebSocket({
    serverUrl,
    onQuestion: handleQuestion,
    onStats: handleStats,
    onLiveAnswer: handleLiveAnswer,
    onLeaderboard: handleLeaderboard,
    onGameStatus: handleGameStatus,
  })

  const handleTimerComplete = useCallback(() => {
    setIsTimerActive(false)
    setIsRevealed(true)
    setShowBurst(true)
    bgMusicRef.current?.stop()
    buzzerSoundRef.current?.play()
  }, [])
// const handleShowWinner = async () => {
//   try {
//     // 1. משיכת נתונים מהשרת
//     const response = await fetch(`${serverUrl}/api/quiz/leaderboard`);
//     setShowWinner(true);



// משתנה עזר מחוץ לפונקציה כדי לעקוב אחרי מספר השאלה
let questionsCounter = 0;

// 1. פונקציית המנצח - ללא הקריאה העצמית המיותרת
// הגדרות בתוך הקומפוננטה
const isProcessingRef = useRef(false);

// 1. פונקציית הצגת המנצח
// המונה והסטטוס נשארים בתוך הקומפוננטה
const questionsCounterRef = useRef(0);
const [isProcessing, setIsProcessing] = useState(false);

// פונקציית המנצח (נשארת דומה, רק בלי טיימרים שממשיכים לשאלה הבאה)
const handleShowWinner = async () => {
  try {
    const response = await fetch(`${serverUrl}/api/quiz/leaderboard`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    
    const data = await response.json();
    if (data && data.length > 0) {
      const sortedData = data.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
      setLeaderboard(sortedData);
      setShowWinner(true);
      applauseSoundRef.current?.play();

      // סגירה אוטומטית של חלונית המנצח אחרי 15 שניות
      setTimeout(() => {
        setShowWinner(false);
      }, 15000);
    }
  } catch (error) {
    console.error("Failed to fetch winner:", error);
  }
};

// פונקציית קידום שאלה - עכשיו היא עושה רק פעולה אחת בכל פעם
const nextQuestion = async () => {
  if (isProcessing) return;
  
 // 1. עצירת כל המנגינות הפעילות מיד לפני המעבר
  [bgMusicRef, tickSoundRef, applauseSoundRef, buzzerSoundRef].forEach(ref => {
    if (ref.current) {
      ref.current.stop(); // ב-Howler משתמשים ב-stop כדי לאפס גם את הזמן
    }
  });

  setIsProcessing(true);
  try {
    const response = await fetch(`${serverUrl}/api/quiz/admin/next`);
    
    if (!response.ok) {
      alert("המשחק הסתיים או שהשרת לא זמין");
      setGameStarted(false);
      setIsProcessing(false);
      
      return;
    }

    questionsCounterRef.current++;
    console.log(`שאלה מספר ${questionsCounterRef.current} הופעלה ידנית`);

    
    // אם את רוצה שהמערכת עדיין תתריע לך מתי להראות מנצח:
    if (questionsCounterRef.current % 7 === 0) {
      console.log("הגעת לסוף סבב, מומלץ להציג מנצח בסיום השאלה הזו.");
    }

  } catch (error) {
    console.error("שגיאה בקידום השאלה:", error);
  } finally {
    setIsProcessing(false);
  }
};


// 3. פונקציית התחלת המשחק (מופעלת מהכפתור)
const startGame = async () => {
  try {
    // ניקוי מוחלט של כל מה שהיה קודם
    if (timerRef.current) clearTimeout(timerRef.current);
    questionsCounterRef.current = 0;
    isProcessingRef.current = false;

    await fetch(`${serverUrl}/api/quiz/admin/start?key=${adminKey}`);
    setGameStarted(true);
    
    console.log("המשחק התחיל, שולח שאלה ראשונה...");
    
    // שליחת השאלה הראשונה מיד
    nextQuestion();

  } catch (error) {
    console.error("Failed to start game:", error);
  }
};

// חשוב: ניקוי טיימרים כשהקומפוננטה נסגרת (Unmount)
useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);

  const winner = leaderboard[0] || null

  return (
  <div className="h-screen bg-background relative overflow-hidden flex flex-col">
    <FloatingShapes />
    <ParticleBurst trigger={showBurst} onComplete={() => setShowBurst(false)} />

    <div className="relative z-10 flex flex-col h-full">
      {/* 1. כותרת רצה - צמודה לקצה העליון */}
      <div className="pt-0.5 shrink-0">
        <EventMarquee eventName="יום הולדת 70 פנירי" />
      </div>

      {/* סטטוס חיבור */}
      <div className="fixed top-2 right-4 z-50 scale-90">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full glass ${
          isConnected ? "text-green-500" : "text-red-500"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`} />
          <span className="text-xs font-medium">
            {isConnected ? "Live" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* 2. אזור התוכן המרכזי - העלאה מקסימלית */}
      <div className="flex-1 container mx-auto px-4 flex items-start overflow-hidden">
        <div className="flex flex-row gap-8 w-full items-stretch h-[88vh] -mt-15">
          
          {/* צד שמאל: השאלה והתשובות - טקסט התשובה בשחור */}
          <div className="flex-[3] flex flex-col justify-start pt-1">
            
            {/* ה-ID הזה חייב לעטוף את ה-QuestionDisplay כדי שהסטייל יעבוד */}
      <div id="force-black-text" className="w-full">
        <style>{`
          #force-black-text *, 
          #force-black-text p, 
          #force-black-text span, 
          #force-black-text div {
            color: #000000 !important;
            opacity: 1 !important;
          }
        `}</style>
              <QuestionDisplay
                question={currentQuestion}
                stats={stats}
                isRevealed={isRevealed}
                questionNumber={questionNumber} // ביטול מספר השאלה לפי בקשתך
              />
            </div>
          </div>

          {/* צד ימין: סטטיסטיקה וטיימר */}
          <div className="flex-1 max-w-[300px] flex flex-col gap-4 py-1 ml-auto">
            
            {/* טיימר - ללא רקע */}
            <div className="pt-16 flex flex-col gap-4">
              <div className="relative inline-flex items-center justify-center scale-90">
                <Timer
                  seconds={20}
                  isActive={isTimerActive}
                  onComplete={handleTimerComplete}
                  key={questionNumber}
                />
              </div>
            </div>

            {/* סטטיסטיקה מעוצבת */}
            <div className="flex-1 glass rounded-[2.5rem] p-6 flex flex-col shadow-2xl border border-white/10 overflow-hidden">
              <h3 className="text-2xl font-bold text-center text-slate-800 mb-2">Live Responses</h3>
              <p className="text-center text-slate-500 text-sm mb-6">
                {stats.answer1 + stats.answer2 + stats.answer3 + stats.answer4} answers
              </p>
              
{/* שימוש ב-ID ספציפי כדי להכריח צבע שחור רק כאן */}
  <div id="main-question-area" className="w-full">
  <style>{`
      #force-black-text, 
      #force-black-text *, 
      #force-black-text p, 
      #force-black-text span, 
      #force-black-text h1, 
      #force-black-text h2, 
      #force-black-text div {
        color: #000000 !important;
        opacity: 1 !important;
      }
    `}</style>  
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
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}>
                        {item.label}
                      </div>
                      
                      <div className="flex-1 h-10 bg-slate-100/40 rounded-full relative overflow-hidden border border-slate-200/30">
                        <motion.div 
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${item.color} opacity-25`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end px-4 font-bold text-slate-700 text-base">
                          {count} ({percentage}%)
                        </div>
                      </div>
                    </div>
                  );
                })}                      </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. לייב טיקר תחתון */}
      <div className="pb-4 shrink-0">
        <LiveTicker answers={liveAnswers} />
      </div>

      {/* פקדי אדמין */}
      {adminKey && (
<div className="fixed bottom-16 left-4 z-50 flex flex-col items-center gap-4">
            <div >
            {!gameStarted ? (
        <button 
        onClick={startGame} 
        className="w-10 h-10 rounded-full bg-green-500/10 hover:bg-green-500/40 text-transparent hover:text-white flex items-center justify-center transition-all duration-300 border border-white/5 shadow-lg"
      >
        <span className="text-[10px]">GO</span>
      </button>
            ) : (
              <div className="flex gap-4">
               
     
     <button 
          onClick={nextQuestion} 
          disabled={isProcessing}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-blue-500/30 text-slate-400/5 hover:text-white flex items-center justify-center transition-all border border-white/5 shadow-sm disabled:opacity-30"
          title="Next Question"
        >
          <span className="text-[9px] font-bold">NEXT</span>
        </button>

        {/* כפתור מנצח - תחתון בטור */}
        <button 
          onClick={handleShowWinner} 
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-purple-500/30 text-slate-400/5 hover:text-white flex items-center justify-center transition-all border border-white/5 shadow-sm"
          title="Show Winner"
        >
          <span className="text-[9px] font-bold">WIN</span>
        </button>





     
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    <AnimatePresence>
  {showWinner && leaderboard[0] && (
    <WinnerOverlay
      winner={leaderboard[0]}
      onClose={() => setShowWinner(false)}
    />
  )}
</AnimatePresence>


  
  </div>
);
}
