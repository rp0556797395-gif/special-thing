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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    private Map<Integer, QuestionStatsDTO> statsMap = new HashMap<>();
        private final Object gameLock = new Object();

        // =========================
        // 🟢 START GAME
        // =========================
        @GetMapping("/admin/start")
        public String startGame(@RequestParam(value = "key", required = false) String key) {

            if (key == null || !key.equals("ADMIN123")) {
                return "Unauthorized";
            }

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
        // בדיקה שהמפתח תואם למפתח של המנהל

            // הפצת ההודעה לכל מי שמחובר (כולל העמוד הראשי!)
            messagingTemplate.convertAndSend("/topic/winner", "SHOW");
            return ResponseEntity.ok("Winner signal sent");

    }
        // =========================
        // 🔵 NEXT QUESTION
        // =========================
        @GetMapping(value = "/admin/next", produces = "application/json; charset=utf-8")
        @ResponseBody
        public Question nextQuestion() {

            if (!quizService.isGameActive()) {
                System.out.println("Game not active");
                return null;
            }


            statsMap.clear();
            System.out.println("=== NEXT QUESTION CLICKED ===");

            int before = quizService.getCurrentGlobalQuestionIndex();
            System.out.println("Before NEXT => currentQ = " + before);

            quizService.nextQuestion();

            int after = quizService.getCurrentGlobalQuestionIndex();
            System.out.println("After NEXT => currentQ = " + after);

            Question currentQuestion = quizService.getCurrentQuestion();

            
            // 🔴 הגנה קריטית מ־500
            if (currentQuestion == null) {
                System.out.println("No question found (NULL)");
                return null;
            }

            // ✅ WebSocket תקין (בלי שבירת JSON)
            messagingTemplate.convertAndSend(
                    "/topic/game-status",
                    currentQuestion
            );

            System.out.println("Broadcast sent: " + currentQuestion.getQuestionText());

            return currentQuestion;
        }

        @GetMapping("/leaderboard")
        public List<Participant> getLeaderboard() {
            return participantRepository.findAll(Sort.by(Sort.Direction.DESC, "score"))
                    .stream()
                    .limit(10)
                    .toList();
        }
        // =========================
        // 🟡 CHECK STATUS (ימות המשיח polling)
        // =========================
        @GetMapping(value = "/check-status", produces = "text/plain; charset=utf-8")
        public String checkStatus(@RequestParam("ApiPhone") String phone) {

            Participant p = participantRepository.findById(phone).orElse(null);

            if (p == null) {
                return "go_to_folder=/";
            }

            if (!quizService.isGameActive()) {
                return "go_to_folder=/5";
            }

            int serverQ = quizService.getCurrentGlobalQuestionIndex();
            int userQ = p.getCurrentQuestionIndex();

            System.out.println("CHECK STATUS => userQ=" + userQ + " serverQ=" + serverQ);

            if (userQ < serverQ) {

                p.setCurrentQuestionIndex(serverQ);
                participantRepository.save(p);

                // 🔥 קריטי: להחזיר לתפריט הראשי
                return "go_to_folder=/";
            }

            return "go_to_folder=/5";
        }




        // =========================
        // 🟣 ANSWER SUBMISSION
        // =========================
//        @GetMapping("/phone-input")
//        public String handleAnswer(
//                @RequestParam("ApiPhone") String phone,
//                @RequestParam("answer") String answer) {
//
//            int score = quizService.processAnswer(phone, answer);
//
//            messagingTemplate.convertAndSend(
//                    "/topic/scores",
//                    "{\"phone\":\"" + phone + "\",\"score\":" + score + "}"
//            );
//
//            return "id_list_message=t-תשובתך התקבלה הציון הוא " + score
//                    + "&go_to_folder=/wait_loop";
//        }




    private QuestionStatsDTO getOrCreateStats(int index) {

        return statsMap.computeIfAbsent(index, k -> new QuestionStatsDTO());
    }

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

        messagingTemplate.convertAndSend(
                "/topic/live-answers",
                phone + " answered: " + answer
        );





        int index = quizService.getCurrentGlobalQuestionIndex();
        QuestionStatsDTO stats = getOrCreateStats(index);

        switch (answer) {
            case "1" -> stats.setAnswer1(stats.getAnswer1() + 1);
            case "2" -> stats.setAnswer2(stats.getAnswer2() + 1);
            case "3" -> stats.setAnswer3(stats.getAnswer3() + 1);
            case "4" -> stats.setAnswer4(stats.getAnswer4() + 1);
        }

        messagingTemplate.convertAndSend("/topic/stats", stats);
        messagingTemplate.convertAndSend(
                "/topic/leaderboard",
                participantRepository.findAll()
        );
        System.out.println("PHONE=" + phone + " ANSWER=" + answer);

        // אם אין תשובה עדיין
        if (answer == null || answer.isEmpty()) {
            return "id_list_message=t-נא הקש תשובה&go_to_folder=/";
        }


        // 🔥 הוספתי: שליפת שאלה נוכחית
        Question question = quizService.getCurrentQuestion();

        // 🔥 הוספתי: בדיקת נכונות תשובה
        boolean correct = question.getCorrectAnswer().equals(answer);

        // 🔥 שיניתי: מעבירים גם האם נכון או לא
        int newScore = quizService.processAnswer(phone, answer, correct);

        messagingTemplate.convertAndSend(
                "/topic/scores",
                "{\"phone\":\"" + phone + "\", \"score\":" + newScore + "}"
        );

        return "id_list_message=t-תשובתך התקבלה הציון הוא " + newScore + "&go_to_folder=/5";
    }


}