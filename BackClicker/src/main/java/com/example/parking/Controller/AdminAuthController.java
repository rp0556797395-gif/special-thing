package com.example.parking.Controller;

import com.example.parking.jwt.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "https://front-clicker-service.onrender.com"}, allowCredentials = "true")
public class AdminAuthController {

    @Autowired
    private JwtUtil jwtUtil;

    // הסיסמה הסודית שלך למסך המנהל - את יכולה לשנות אותה למה שאת רוצה
    private final String ADMIN_PASSWORD = "PniriAdmin70";

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String password = request.get("password");

        // בדיקה אם הסיסמה שהוקלדה בפרונטאנד נכונה
        if (ADMIN_PASSWORD.equals(password)) {
            // מייצרים טוקן מאובטח לאדמין למשך שעה
            String token = jwtUtil.generateToken("admin", password, 1L);

            // מחזירים את הטוקן לפרונטאנד
            return ResponseEntity.ok(Map.of("token", token));
        }

        // אם הסיסמה שגויה, מחזירים שגיאת אבטחה
        return ResponseEntity.status(401).body(Map.of("error", "סיסמה שגויה, הגישה נדחתה"));
    }
}
