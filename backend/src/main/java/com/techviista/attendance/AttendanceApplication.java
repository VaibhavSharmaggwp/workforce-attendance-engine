package com.techviista.attendance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@SpringBootApplication
public class AttendanceApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(AttendanceApplication.class, args);
    }

    private static void loadDotEnv() {
        Path[] possiblePaths = {
                Path.of(".env"),
                Path.of("backend", ".env"),
                Path.of("..", ".env"),
                Path.of("..", "backend", ".env")
        };

        for (Path path : possiblePaths) {
            if (Files.exists(path)) {
                try {
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int equalsIdx = line.indexOf('=');
                        if (equalsIdx > 0) {
                            String key = line.substring(0, equalsIdx).trim();
                            String value = line.substring(equalsIdx + 1).trim();
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }
}
