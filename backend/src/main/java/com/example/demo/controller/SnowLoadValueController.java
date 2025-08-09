package com.example.demo.controller;

import com.example.demo.model.SnowLoadValue;
import com.example.demo.repository.SnowLoadValueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/snow-load-values")
@CrossOrigin(origins = "http://localhost:3000")
public class SnowLoadValueController {

    @Autowired
    private SnowLoadValueRepository snowLoadValueRepository;

    @GetMapping
    public List<SnowLoadValue> getAllSnowLoadValues() {
        return snowLoadValueRepository.findAll();
    }
} 