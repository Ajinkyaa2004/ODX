package com.intraday.optionchain;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OptionChainServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(OptionChainServiceApplication.class, args);
        System.out.println("========================================");
        System.out.println("Option Chain Service Started Successfully");
        System.out.println("Port: 8082");
        System.out.println("========================================");
    }
}
