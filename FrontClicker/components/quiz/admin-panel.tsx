"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FloatingShapes } from "./floating-shapes"

interface Question {
  id?: number
  questionNumber: number
  questionText: string
  answer1: string
  answer2: string
  answer3: string
  answer4: string
  correctAnswer: string
}

interface AdminPanelProps {
  serverUrl: string
}

export function AdminPanel({ serverUrl }: AdminPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState<Question>({
    questionNumber: 1,
    questionText: "",
    answer1: "",
    answer2: "",
    answer3: "",
    answer4: "",
    correctAnswer: "1",
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/questions/GetAll`)
      const data = await response.json()
      setQuestions(data)
    } catch (error) {
      console.error("Failed to fetch questions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingQuestion?.id) {
        await fetch(`${serverUrl}/api/questions/update/${editingQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      } else {
        await fetch(`${serverUrl}/api/questions/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }
      
      fetchQuestions()
      resetForm()
    } catch (error) {
      console.error("Failed to save question:", error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return
    
    try {
      await fetch(`${serverUrl}/api/questions/delete/${id}`, {
        method: "DELETE",
      })
      fetchQuestions()
    } catch (error) {
      console.error("Failed to delete question:", error)
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    setFormData(question)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      questionNumber: questions.length + 1,
      questionText: "",
      answer1: "",
      answer2: "",
      answer3: "",
      answer4: "",
      correctAnswer: "1",
    })
    setEditingQuestion(null)
    setShowForm(false)
  }

  const answerColors = [
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-orange-500",
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <FloatingShapes />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black bg-gradient-to-r from-pink-500 via-cyan-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            Quiz Admin Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your quiz questions
          </p>
        </motion.div>

        {/* Add Question Button */}
        <div className="flex justify-center mb-8">
          <motion.button
            onClick={() => {
              setFormData({ ...formData, questionNumber: questions.length + 1 })
              setShowForm(true)
            }}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold rounded-xl text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ boxShadow: "0 0 30px rgba(255,0,150,0.3)" }}
          >
            + Add New Question
          </motion.button>
        </div>

        {/* Question Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={resetForm} />
              
              <motion.form
                onSubmit={handleSubmit}
                className="relative glass rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </h2>

                <div className="space-y-6">
                  {/* Question Number */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Question Number *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.questionNumber}
                      onChange={(e) => setFormData({ ...formData, questionNumber: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Question Text *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.questionText}
                      onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary outline-none resize-none"
                      placeholder="Enter your question..."
                    />
                  </div>

                  {/* Answers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["answer1", "answer2", "answer3", "answer4"].map((key, idx) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Answer {idx + 1} *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData[key as keyof Question] as string}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                            className={`w-full px-4 py-3 rounded-xl bg-muted border-2 ${
                              formData.correctAnswer === String(idx + 1) ? "border-green-500" : "border-border"
                            } focus:ring-2 focus:ring-primary outline-none`}
                            placeholder={`Answer ${idx + 1}`}
                          />
                          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b ${answerColors[idx]}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Correct Answer */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Correct Answer *
                    </label>
                    <div className="flex gap-4">
                      {["1", "2", "3", "4"].map((num, idx) => (
                        <label
                          key={num}
                          className={`flex-1 p-4 rounded-xl cursor-pointer transition-all ${
                            formData.correctAnswer === num
                              ? `bg-gradient-to-r ${answerColors[idx]} text-white`
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={num}
                            checked={formData.correctAnswer === num}
                            onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                            className="sr-only"
                          />
                          <span className="block text-center font-bold text-lg">
                            {String.fromCharCode(64 + parseInt(num))}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <motion.button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 bg-muted rounded-xl font-medium hover:bg-muted/80 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold rounded-xl"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingQuestion ? "Update" : "Add"} Question
                  </motion.button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📝</div>
            <p className="text-xl text-muted-foreground">No questions yet. Add your first question!</p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {questions.map((question, idx) => (
              <motion.div
                key={question.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                      {question.questionNumber || idx + 1}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {question.questionText}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => handleEdit(question)}
                      className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={() => question.id && handleDelete(question.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[question.answer1, question.answer2, question.answer3, question.answer4].map((answer, ansIdx) => (
                    <div
                      key={ansIdx}
                      className={`p-3 rounded-xl ${
                        question.correctAnswer === String(ansIdx + 1)
                          ? `bg-gradient-to-r ${answerColors[ansIdx]} text-white`
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{String.fromCharCode(65 + ansIdx)}.</span>
                        <span className="text-sm">{answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
