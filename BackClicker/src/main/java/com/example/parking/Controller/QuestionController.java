package com.example.parking.Controller;

import com.example.parking.Entities.Question;
import com.example.parking.Reposetories.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true") // השורה הזו פותרת את השגיאה!
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    // 📋 קבלת כל השאלות
    @GetMapping("GetAll")
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    // ➕ הוספת שאלה
    @PostMapping("add")
    public Question addQuestion(@RequestBody Question question) {
        return questionRepository.save(question);
    }

    // ❌ מחיקת שאלה
    @DeleteMapping("delete/{id}")
    public void deleteQuestion(@PathVariable Long id) {
        questionRepository.deleteById(id);
    }

    // ✏️ עדכון שאלה (אופציונלי אבל מומלץ)
    @PutMapping("update/{id}")
    public Question updateQuestion(@PathVariable Long id,
                                   @RequestBody Question newQuestion) {

        return questionRepository.findById(id)
                .map(q -> {
                    q.setQuestionText(newQuestion.getQuestionText());
                    q.setAnswer1(newQuestion.getAnswer1());
                    q.setAnswer2(newQuestion.getAnswer2());
                    q.setAnswer3(newQuestion.getAnswer3());
                    q.setAnswer4(newQuestion.getAnswer4());
                    q.setCorrectAnswer(newQuestion.getCorrectAnswer());
                    return questionRepository.save(q);
                })
                .orElseThrow(() -> new RuntimeException("Question not found"));
    }
}
