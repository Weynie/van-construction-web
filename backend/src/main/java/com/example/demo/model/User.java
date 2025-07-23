
package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "registers")
@Data
public class User {
    @Id @GeneratedValue
    private Long id;
    private String email;
    private String username;
    private String password;
}
