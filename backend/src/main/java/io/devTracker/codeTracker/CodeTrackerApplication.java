package io.devTracker.codeTracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CodeTrackerApplication {

	public static void main(String[] args) {
		SpringApplication.run(CodeTrackerApplication.class, args);
	}

}
