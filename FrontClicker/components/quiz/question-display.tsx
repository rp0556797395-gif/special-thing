"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { Question, QuestionStats } from "@/hooks/use-quiz-websocket"
import { AnswerCard } from "./answer-card"

interface QuestionDisplayProps {
  question: Question | null
  stats: QuestionStats
  isRevealed: boolean
  questionNumber?: number
}

export function QuestionDisplay({
  question,
  stats,
  isRevealed,
  questionNumber,
}: QuestionDisplayProps) {
  if (!question) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-cyan-500"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        <p className="whitespace-pre-line text-center text-xl md:text-3xl font-bold leading-relaxed bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent p-4">
           {`המשחק מתחיל בעוד 30 שניות!
  
  נא להתקשר למספר:
  077-2263251📞
 
  להקיש מספר 1 (רק בשביל שישמיע את הפרסומת לפני שהמשחק יתחיל)

  בכל שאלה יש להקיש את מספר התשובה
  פעמיים !
  
  
  `}
        </p>
      </motion.div>
    )
  }

  const total = stats.answer1 + stats.answer2 + stats.answer3 + stats.answer4
  const percentages = total > 0
    ? {
        answer1: (stats.answer1 / total) * 100,
        answer2: (stats.answer2 / total) * 100,
        answer3: (stats.answer3 / total) * 100,
        answer4: (stats.answer4 / total) * 100,
      }
    : { answer1: 0, answer2: 0, answer3: 0, answer4: 0 }

  const answers = [
    { text: question.answer1, percentage: percentages.answer1, isCorrect: question.correctAnswer === "1" },
    { text: question.answer2, percentage: percentages.answer2, isCorrect: question.correctAnswer === "2" },
    { text: question.answer3, percentage: percentages.answer3, isCorrect: question.correctAnswer === "3" },
    { text: question.answer4, percentage: percentages.answer4, isCorrect: question.correctAnswer === "4" },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Question number badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="text-center mb-6"
        >
          <motion.span
            className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold text-lg"
            animate={{
              boxShadow: [
                "0 0 20px rgba(255,0,150,0.5)",
                "0 0 40px rgba(0,200,255,0.5)",
                "0 0 20px rgba(255,0,150,0.5)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Question {questionNumber || question.questionNumber || question.id}
          </motion.span>
        </motion.div>
      </AnimatePresence>

      {/* Question text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, scale: 0.8, rotateX: -20 }}
          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotateX: 20 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative mb-10"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-3xl blur-xl opacity-30" />
          <div className="relative glass rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center leading-tight text-balance">
              {question.questionText}
            </h2>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Answer grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        >
          {answers.map((answer, index) => (
            <AnswerCard
              key={index}
              index={index}
              text={answer.text}
              isCorrect={answer.isCorrect}
              isRevealed={isRevealed}
              percentage={isRevealed ? answer.percentage : 0}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
