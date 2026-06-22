package com.example.parking.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // השרת ישלח הודעות ללקוח דרך נתיבים שמתחילים ב- /topic
        config.enableSimpleBroker("/topic");
        // הלקוח ישלח הודעות לשרת דרך נתיבים שמתחילים ב- /app
        config.setApplicationDestinationPrefixes("/app");

    }


    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // זוהי נקודת החיבור הראשונית של ה-React לשרת
        registry.addEndpoint("/ws-quiz")
                .setAllowedOriginPatterns("*") // מאפשר גישה מכל דומיין (חשוב לפיתוח)
                .withSockJS();
    }
}