package com.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "snow_load_values")
public class SnowLoadValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String city;

    @Column(name = "ground_snow_load_kpa")
    private Double groundSnowLoadKpa;

    @Column(name = "rain_snow_load_kpa")
    private Double rainSnowLoadKpa;

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Double getGroundSnowLoadKpa() {
        return groundSnowLoadKpa;
    }

    public void setGroundSnowLoadKpa(Double groundSnowLoadKpa) {
        this.groundSnowLoadKpa = groundSnowLoadKpa;
    }

    public Double getRainSnowLoadKpa() {
        return rainSnowLoadKpa;
    }

    public void setRainSnowLoadKpa(Double rainSnowLoadKpa) {
        this.rainSnowLoadKpa = rainSnowLoadKpa;
    }
} 