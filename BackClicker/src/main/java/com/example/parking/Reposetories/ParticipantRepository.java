package com.example.parking.Reposetories;


import com.example.parking.Entities.Participant;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipantRepository extends JpaRepository<Participant, String> {
    @Modifying
    @Transactional
    @Query("UPDATE Participant p SET p.score = 0")
     void resetAllScores();

    List<Participant> findTopByOrderByScoreDesc();
}