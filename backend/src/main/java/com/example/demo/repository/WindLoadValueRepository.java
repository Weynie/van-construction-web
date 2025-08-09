package com.example.demo.repository;

import com.example.demo.model.WindLoadValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WindLoadValueRepository extends JpaRepository<WindLoadValue, Long> {
} 