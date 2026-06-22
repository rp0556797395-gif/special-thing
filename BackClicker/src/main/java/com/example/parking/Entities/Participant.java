package com.example.parking.Entities;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Participant {
    @Id
    private String phoneNumber; // מספר הטלפון הוא המזהה הייחודי
    private int score;

    public void setCurrentQuestionIndex(int currentQuestionIndex) {
        this.currentQuestionIndex = currentQuestionIndex;
    }

    public int getCurrentQuestionIndex() {
        return currentQuestionIndex;
    }

    private int currentQuestionIndex; // להוסיף את השורה הזו

    public Participant() {}

    public Participant(int currentQuestionIndex, int score, String phoneNumber) {
        this.currentQuestionIndex = currentQuestionIndex;
        this.score = score;
        this.phoneNumber = phoneNumber;
    }

    // Getters and Setters
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}