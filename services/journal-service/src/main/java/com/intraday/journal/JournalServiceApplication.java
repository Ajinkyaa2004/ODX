package com.intraday.journal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JournalServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(JournalServiceApplication.class, args);
        System.out.println("========================================");
        System.out.println("Journal Service Started Successfully");
        System.out.println("Port: 8084");
        System.out.println("========================================");
    }
}
