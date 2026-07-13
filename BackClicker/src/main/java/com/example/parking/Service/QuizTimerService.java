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

    // הזמן הנותר בפועל - נשמר כשדה כדי שאפשר יהיה להשהות ולהמשיך בלי לאבד אותו
    private volatile int timeLeft = 0;
    private volatile boolean isPaused = false;

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
        isPaused = false;

        // שידור מיידי של השנייה הראשונה כדי שהמסך לא ימתין
        messagingTemplate.convertAndSend("/topic/timer", seconds);
        System.out.println("Time left: " + seconds);

        timeLeft = seconds - 1;
        scheduleTick();
    }

    // מריץ (או ממשיך להריץ) את הלולאה מ-timeLeft הנוכחי, כל שנייה בדיוק
    private void scheduleTick() {
        currentTimer = taskScheduler.scheduleAtFixedRate(() -> {
            if (timeLeft >= 0) {
                messagingTemplate.convertAndSend("/topic/timer", timeLeft);
                System.out.println("Time left: " + timeLeft);
                timeLeft--;
            } else {
                stopTimer();
            }
        }, Duration.ofSeconds(1));
    }

    // ⏸️ השהיית הטיימר האמיתי - מבטלת את הריצה המתוזמנת בלי לשדר TIME_UP ובלי לאפס timeLeft
    public synchronized void pauseTimer() {
        if (currentTimer != null && !currentTimer.isCancelled() && !isPaused) {
            isPaused = true;
            currentTimer.cancel(false);
            System.out.println("⏸ Timer paused at " + timeLeft);
        }
    }

    // ▶️ המשך הטיימר האמיתי - ממשיך בדיוק מ-timeLeft שבו הוא נעצר
    public synchronized void resumeTimer() {
        if (isPaused) {
            isPaused = false;
            System.out.println("▶ Timer resumed at " + timeLeft);
            scheduleTick();
        }
    }

    public synchronized boolean isPaused() {
        return isPaused;
    }

    // עצירה בטוחה של הטיימר הפעיל
    public synchronized void stopTimer() {
        if (currentTimer != null && !currentTimer.isCancelled()) {
            currentTimer.cancel(true);
            messagingTemplate.convertAndSend("/topic/timer", "TIME_UP");
        }
        isPaused = false;
    }
}