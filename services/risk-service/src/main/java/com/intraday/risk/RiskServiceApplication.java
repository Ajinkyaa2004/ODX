package com.intraday.risk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RiskServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(RiskServiceApplication.class, args);
        System.out.println("========================================");
        System.out.println("Risk Service Started Successfully");
        System.out.println("Port: 8083");
        System.out.println("========================================");
    }
}
