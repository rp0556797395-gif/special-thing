package com.example.parking.Controller;

import com.example.parking.Dto.QuestionStatsDTO;
import com.example.parking.Entities.Participant;
import com.example.parking.Entities.Question;
import com.example.parking.Reposetories.ParticipantRepository;
import com.example.parking.Service.QuizService;
import com.example.parking.Service.QuizTimerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz")
@CrossOrigin(origins = {"http://localhost:3000", "https://front-clicker-service.onrender.com"}, allowCredentials = "true")
public class PhoneQuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizTimerService quizTimerService;

    @Autowired
    private ParticipantRepository participantRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Object gameLock = new Object();

    // =========================
    // 🟢 START GAME
    // =========================
    @GetMapping("/admin/start")
    public String startGame(@RequestParam(value = "key", required = false) String key) {
      

        synchronized (gameLock) {
            quizService.startGame();
            messagingTemplate.convertAndSend(
                    "/topic/game-status",
                    "{\"status\":\"STARTED\",\"question\":1}"
            );
        }
        quizTimerService.startTimer(20);
        return "Game Started";
    }

    @GetMapping("/show-winner")
    public ResponseEntity<String> showWinner(@RequestParam String key) {
        messagingTemplate.convertAndSend("/topic/winner", "SHOW");
        return ResponseEntity.ok("Winner signal sent");
    }

    // =========================
    // 🔵 NEXT QUESTION
    // =========================
    @GetMapping(value = "/admin/next", produces = "application/json; charset=utf-8")
    @ResponseBody
    public Question nextQuestion() {
        synchronized (gameLock) { // הגנה מפני לחיצות כפולות בו זמנית ברמת השרת
            if (!quizService.isGameActive()) {
                System.out.println("Game not active");
                return null;
            }

            System.out.println("=== NEXT QUESTION CLICKED ===");
            int before = quizService.getCurrentGlobalQuestionIndex();
            System.out.println("Before NEXT => currentQ = " + before);

            quizService.nextQuestion();

            int after = quizService.getCurrentGlobalQuestionIndex();
            System.out.println("After NEXT => currentQ = " + after);

            // הפעלת הטיימר החדש
            quizTimerService.startTimer(20);

            Question currentQuestion = quizService.getCurrentQuestion();

            if (currentQuestion == null) {
                System.out.println("No question found (NULL)");
                return null;
            }

            // שידור השאלה למשתתפים
            messagingTemplate.convertAndSend("/topic/game-status", currentQuestion);
            System.out.println("Broadcast sent: " + currentQuestion.getQuestionText());

            return currentQuestion;
        }
    }

    @GetMapping("/leaderboard")
    public List<Participant> getLeaderboard() {
        // קריאה נקייה, בטוחה, ויעילה פי 100
        return participantRepository.findTopByOrderByScoreDesc();
    }

    // =========================
    // 🟡 CHECK STATUS (Polling)
    // =========================
    @GetMapping(value = "/check-status", produces = "text/plain; charset=utf-8")
    public String checkStatus(@RequestParam("ApiPhone") String phone) {
        Participant p = participantRepository.findById(phone).orElse(null);

        if (p == null) return "go_to_folder=/";
        if (!quizService.isGameActive()) return "go_to_folder=/5";

        int serverQ = quizService.getCurrentGlobalQuestionIndex();
        int userQ = p.getCurrentQuestionIndex();

        System.out.println("CHECK STATUS => userQ=" + userQ + " serverQ=" + serverQ);

        if (userQ < serverQ) {
            p.setCurrentQuestionIndex(serverQ);
            participantRepository.save(p);
            return "go_to_folder=/";
        }

        return "go_to_folder=/5";
    }

    // =========================
    // 🟣 ANSWER SUBMISSION (קליטת תשובות מהטלפונים)
    // =========================
    @GetMapping(value = "/phone-input", produces = "text/plain; charset=utf-8")
    public String handlePhoneInput(
            @RequestParam("ApiPhone") String phone,
            @RequestParam(value = "answer", required = false) String answer) {

        if (!quizService.isGameActive()) {
            return "read=t-המשחק עוד לא התחיל&go_to_folder=/";
        }
        if (!quizService.hasActiveQuestion()) {
            return "read=t-המתן לשאלה הראשונה&go_to_folder=/";
        }
        if (answer == null || answer.isEmpty()) {
            return "id_list_message=t-נא הקש תשובה&go_to_folder=/";
        }

        // שידור הלייב טיקר של מי שענה ברגע זה
        messagingTemplate.convertAndSend("/topic/live-answers", phone + " answered: " + answer);

        // שליפת הנתונים לבדיקה
        Question question = quizService.getCurrentQuestion();
        boolean correct = question.getCorrectAnswer().equals(answer);

        // עדכון ה-Service (שם מתבצע עדכון הניקוד וגם ספירת הסטטיסטיקה פעם אחת בלבד!)
        int newScore = quizService.processAnswer(phone, answer, correct);

        // משיכת הסטטיסטיקה המעודכנת והנקייה מה-Service
        int currentQuestionId = question.getId().intValue();
        QuestionStatsDTO stats = quizService.getStatsForQuestion(currentQuestionId);

        // הפצת הנתונים המעודכנים לכל מסכי ה-WebSockets
        messagingTemplate.convertAndSend("/topic/stats", stats);
        messagingTemplate.convertAndSend("/topic/leaderboard", getLeaderboard());

        System.out.println("PHONE=" + phone + " ANSWER=" + answer + " SCORE=" + newScore);

        return "id_list_message=t-תשובתך התקבלה הציון הוא " + newScore + "&go_to_folder=/5";
    }
}