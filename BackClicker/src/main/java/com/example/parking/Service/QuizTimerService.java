package com.example.parking.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.*;

@Service
public class QuizTimerService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private ScheduledFuture<?> currentTimer;

    public void startTimer(int seconds) {
        // אם כבר רץ טיימר משאלה קודמת - נעצור אותו
        if (currentTimer != null && !currentTimer.isDone()) {
            currentTimer.cancel(true);
        }

        // משתנה עזר כדי שנוכל להפחית ממנו בתוך הלולאה
        final int[] timeLeft = {seconds};

        // פקודה שאומרת לשרת: "כל שנייה תעשה את מה שכתוב כאן"
        currentTimer = scheduler.scheduleAtFixedRate(() -> {
            if (timeLeft[0] >= 0) {
                // שידור הזמן לכל השחקנים דרך ה-WebSocket
                messagingTemplate.convertAndSend("/topic/timer", timeLeft[0]);
                System.out.println("Time left: " + timeLeft[0]); // להדפסה בטרמינל שלך
                timeLeft[0]--;
            } else {
                stopTimer();
            }
        }, 0, 1, TimeUnit.SECONDS);
    }

    public void stopTimer() {
        if (currentTimer != null) {
            currentTimer.cancel(true);
            // אפשר לשלוח הודעה שהזמן נגמר
            messagingTemplate.convertAndSend("/topic/timer", "TIME_UP");
        }
    }
}
