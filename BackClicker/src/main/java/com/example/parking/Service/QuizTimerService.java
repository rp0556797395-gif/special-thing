package com.example.parking.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.ScheduledFuture;

@Service
public class QuizTimerService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final ThreadPoolTaskScheduler taskScheduler;
    private ScheduledFuture<?> currentTimer;

    // קונסטרקטור שמאתחל את ה-Scheduler המובנה של Spring בצורה בטוחה
    public QuizTimerService() {
        this.taskScheduler = new ThreadPoolTaskScheduler();
        this.taskScheduler.setPoolSize(1);
        this.taskScheduler.setThreadNamePrefix("QuizTimer-");
        this.taskScheduler.initialize();
    }

    // מתודה מסונכרנת למניעת ריצת טיימרים כפולים במקביל
    public synchronized void startTimer(int seconds) {
        // עצירת טיימר קודם במידה וקיים
        stopTimer();

        // שידור מיידי של השנייה הראשונה כדי שהמסך לא ימתין
        messagingTemplate.convertAndSend("/topic/timer", seconds);
        System.out.println("Time left: " + seconds);

        final int[] timeLeft = {seconds - 1};

        // הפעלת לולאת זמן שרצה בדיוק כל שנייה אחת
        currentTimer = taskScheduler.scheduleAtFixedRate(() -> {
            if (timeLeft[0] >= 0) {
                messagingTemplate.convertAndSend("/topic/timer", timeLeft[0]);
                System.out.println("Time left: " + timeLeft[0]);
                timeLeft[0]--;
            } else {
                stopTimer();
            }
        }, Duration.ofSeconds(1));
    }

    // עצירה בטוחה של הטיימר הפעיל
    public synchronized void stopTimer() {
        if (currentTimer != null && !currentTimer.isCancelled()) {
            currentTimer.cancel(true);
            messagingTemplate.convertAndSend("/topic/timer", "TIME_UP");
        }
    }
}