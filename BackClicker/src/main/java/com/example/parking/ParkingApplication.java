package com.example.parking;

import com.example.parking.Entities.Question; // מוודא שמשתמש בישות מהחבילה הנכונה
import com.example.parking.Reposetories.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.ArrayList;
import java.util.List;
@SpringBootApplication
@EnableScheduling
public class ParkingApplication {

	// הרשימה צריכה להיות מחוץ ל-main כדי שכולם יכירו אותה

	public static void main(String[] args) {
		SpringApplication.run(ParkingApplication.class, args);
		System.out.println("--- השרת עלה בהצלחה! מוכן לקבל שיחות מימות המשיח ---");
	}

	@Bean
	public CommandLineRunner initQuestions(QuestionRepository repo) {
		return args -> {

			if (repo.count() > 0) return; // לא לטעון פעמיים

			repo.save(new Question(null,
					"מהי בירת ישראל?",
					"ת\"א", "ירושלים", "חיפה", "ב\"ש",
					"2"));

			repo.save(new Question(null,
					"כמה ימים יש בשבוע?",
					"5", "6", "7", "8",
					"3"));

			repo.save(new Question(null,
					"מהו צבע השמיים ביום בהיר?",
					"אדום", "ירוק", "כחול", "סגול",
					"3"));

			repo.save(new Question(null,
					"מי כתב את ספר התהילים?",
					"שלמה", "דוד המלך", "משה", "אברהם",
					"2"));

			repo.save(new Question(null,
					"איזו חיה היא הגבוהה ביותר?",
					"פיל", "ג'ירפה", "גמל", "דוב",
					"2"));

			repo.save(new Question(null,
					"באיזו עיר נמצא הכותל?",
					"חברון", "צפת", "טבריה", "ירושלים",
					"4"));

			repo.save(new Question(null,
					"כמה חומשים יש בתורה?",
					"3", "4", "5", "6",
					"3"));

			repo.save(new Question(null,
					"מאיזה פרי מפיקים יין?",
					"תפוח", "ענבים", "תפוז", "רימון",
					"2"));

			repo.save(new Question(null,
					"החודש הראשון למניין החודשים?",
					"תשרי", "ניסן", "שבט", "כסלו",
					"2"));

			repo.save(new Question(null,
					"היבשת הגדולה בעולם?",
					"אירופה", "אפריקה", "אסיה", "אמריקה",
					"3"));

			System.out.println("✔ 10 שאלות נטענו בהצלחה");
		};
	}

	// משתמשים בשם שונה כדי לא להתנגש עם ה-Entity של הדאטהבייס
	public static class QuestionData {
		public String text;
		public String[] options;
		public String correctAnswer;

		public QuestionData(String text, String[] options, String correctAnswer) {
			this.text = text;
			this.options = options;
			this.correctAnswer = correctAnswer;
		}
	}
}