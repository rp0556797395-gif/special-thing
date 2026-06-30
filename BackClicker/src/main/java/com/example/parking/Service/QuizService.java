package com.example.parking.Service;
import com.example.parking.Dto.QuestionStatsDTO;
import com.example.parking.Entities.Participant;
import com.example.parking.Entities.Question;
import com.example.parking.Reposetories.ParticipantRepository;
import com.example.parking.Reposetories.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class QuizService {

    @Autowired
    private QuestionRepository questionRepository;
    @Autowired
    private ParticipantRepository repository;
    @Autowired
    private ParticipantRepository participantRepository;

    private Map<Integer, QuestionStatsDTO> statsMap = new HashMap<>();
    private int currentGlobalQuestionIndex = 0;
    private int questionVersion = 0;
    private boolean gameActive = false;

    private int questionTimeSeconds = 20; // זמן לכל שאלה

    private List<Question> activeQuestions = new ArrayList<>();



    // =====================
    // START GAME
    // =====================
    public void startGame() {
        this.activeQuestions = questionRepository.findAll(); // טוען את כל השאלות לרשימה
        gameActive = true;
        participantRepository.resetAllScores();
        currentGlobalQuestionIndex = -1;
        questionVersion = 1;
        this.statsMap.clear(); // איפוס סטטיסטיקות בתחילת משחק חדש
        if (!activeQuestions.isEmpty()) {
            initializeStatsForQuestion(activeQuestions.get(0).getId());
        }


    }

    public boolean hasActiveQuestion() {
        return currentGlobalQuestionIndex >= 0;
    }
    // =====================
    // NEXT QUESTION (ONLY ONE!)
    // =====================

    // =====================
    // NEXT QUESTION (ONLY ONE!)
    // =====================
    public void nextQuestion() {
        if (!gameActive || activeQuestions.isEmpty()) return;

        // בדיקה אם יש שאלה נוספת ברשימה
        if (currentGlobalQuestionIndex + 1 < activeQuestions.size()) {
            currentGlobalQuestionIndex++; // קידום אחד ויחיד!
            long nextQuestionId = getCurrentQuestion().getId();

            // אתחול סטטיסטיקה לשאלה החדשה אם היא עדיין לא קיימת במאפ
            initializeStatsForQuestion(nextQuestionId);
            questionVersion++; // מקדמים את הגרסה רק אם באמת עברנו שאלה
        } else {
            System.out.println("No more questions. Ending game.");
            gameActive = false;
        }

        // מחיקתי מפה את הקידום הכפול שהיה: currentGlobalQuestionIndex++
    }

    private void initializeStatsForQuestion(long questionId) {
        if (!statsMap.containsKey(questionId)) {
            statsMap.put((int) questionId, new QuestionStatsDTO());
        }
    }
    // =====================
    // GETTERS
    // =====================
    public int getCurrentGlobalQuestionIndex() {
        return currentGlobalQuestionIndex;
    }

    public int getQuestionVersion() {
        return questionVersion;
    }

    public boolean isGameActive() {
        return gameActive;
    }

    // =====================
    // ANSWER PROCESSING
    // =====================
    public int processAnswer(String phone, String answer, boolean correct) {

        // 🔥 חישוב נקודות:
        // אם התשובה נכונה (correct == true) → מוסיפים 50 נקודות, אחרת → 0 נקודות
        int pointsToAdd = correct ? 50 : 0;

        // 🔥 שליפת המשתמש לפי מספר טלפון
        // אם לא קיים → יצירת משתמש חדש עם ניקוד התחלתי 0
        Participant p = repository.findById(phone)
                .orElse(new Participant(1, 0, phone));

        // 🔥 עדכון מספר טלפון (למקרה של משתמש חדש)
        p.setPhoneNumber(phone);

        // 🔥 הוספת הנקודות שחושבו למשתמש
        p.setScore(p.getScore() + pointsToAdd);

        // 🔥 שמירת אינדקס השאלה הנוכחית לצורך מעקב אחרי התקדמות השחקן
        p.setCurrentQuestionIndex(currentGlobalQuestionIndex);

        // 🔥 שמירת הנתונים המעודכנים לדאטהבייס
        repository.save(p);

        // 🔥 עדכון הסטטיסטיקה לפי ה-ID של השאלה (מתוקן!)
        Question currentQuestion = getCurrentQuestion();
        if (currentQuestion != null) {
            // המרה בטוחה של ה-ID מ-Long ל-int
            int currentQuestionId = currentQuestion.getId().intValue();

            // יצירת אובייקט סטטיסטיקה חדש לשאלה הזו אם הוא עדיין לא קיים במאפ
            statsMap.putIfAbsent(currentQuestionId, new QuestionStatsDTO());

            // שליפת הסטטיסטיקה המעודכנת של השאלה הנוכחית
            QuestionStatsDTO stats = statsMap.get(currentQuestionId);

            // הוספת הצבעה בהתאם לתשובה שהתקבלה מהטלפון
            switch (answer) {
                case "1" -> stats.setAnswer1(stats.getAnswer1() + 1);
                case "2" -> stats.setAnswer2(stats.getAnswer2() + 1);
                case "3" -> stats.setAnswer3(stats.getAnswer3() + 1);
                case "4" -> stats.setAnswer4(stats.getAnswer4() + 1);
            }
        }

        // 🔥 החזרת הניקוד המעודכן של המשתמש
        return p.getScore();
    }
    public Question getCurrentQuestion() {
        if (currentGlobalQuestionIndex < 0) return null;
        return activeQuestions.get(currentGlobalQuestionIndex);
    }

    public QuestionStatsDTO getStatsForQuestion(int questionId) {
        return statsMap.getOrDefault(questionId, new QuestionStatsDTO());
    }
    public void resetGame() {
        gameActive = false;
        currentGlobalQuestionIndex = 0;
        // questionStartTime = 0;
    }
}