package com.techviista.attendance.events;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationConsumer {
    @KafkaListener(topics = "attendance-events", groupId = "attendance-group")
    public void consumeAttendanceEvent(AttendanceEvent event){
        // This runs asynchronously. It does not block the HTTP request.
        log.info("Received Event -> Employee: {} performed Action: {} at {}",
                event.employeeId(), event.action(), event.timestamp());

        // Future logic goes here:
        // - Send Slack/Teams message to Manager
        // - Trigger email via AWS SES / SendGrid
        // - Push data to a downstream Payroll microservice
    }
}
