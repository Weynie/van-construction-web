package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "sediment_types")
@Data
public class SedimentType {
    @Id
    private Integer id;
    private String sediment_name;
    private String site_class;
    private Integer soil_pressure_psf;
    private Integer color_r;
    private Integer color_g;
    private Integer color_b;
} 