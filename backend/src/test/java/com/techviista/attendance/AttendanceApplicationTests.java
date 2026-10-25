package com.techviista.attendance;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Disabled("Requires live PostgreSQL database credentials configured in environment variables")
class AttendanceApplicationTests {

	@Test
	void contextLoads() {
	}

}
