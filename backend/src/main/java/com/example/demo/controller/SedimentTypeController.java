package com.example.demo.controller;

import com.example.demo.model.SedimentType;
import com.example.demo.repository.SedimentTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sediment-types")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SedimentTypeController {
    @Autowired
    private SedimentTypeRepository sedimentTypeRepository;

    @GetMapping
    public List<SedimentType> getAllSedimentTypes() {
        return sedimentTypeRepository.findAll();
    }
} 