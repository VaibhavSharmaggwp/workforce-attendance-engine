package com.techviista.attendance.events;

import com.techviista.attendance.alerts.service.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class InactivityAlertConsumer {

    private final EmailNotificationService emailNotificationService;

    @KafkaListener(topics = "attendance-alerts", groupId = "attendance-alerts-group")
    public void consumeInactivityAlert(InactivityAlertEvent event) {
        log.info("Kafka consumer received InactivityAlertEvent for employee: {} (Idle: {} mins)",
                event.employeeName(), event.idleMinutes());
        emailNotificationService.sendInactivityAlertEmail(event);
    }
}
