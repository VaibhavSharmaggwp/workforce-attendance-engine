package com.techviista.attendance.alerts.service;

import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicBoolean;

@Service
@Slf4j
public class AlertSettingsService {

    // Default: Email alerts enabled
    private final AtomicBoolean emailAlertsEnabled = new AtomicBoolean(true);

    public boolean isEmailAlertsEnabled() {
        return emailAlertsEnabled.get();
    }

    public boolean setEmailAlertsEnabled(boolean enabled) {
        emailAlertsEnabled.set(enabled);
        log.info("Manager updated Inactivity Email Alert preference to: {}", enabled);
        return enabled;
    }

    public boolean toggleEmailAlerts() {
        boolean updated = !emailAlertsEnabled.get();
        emailAlertsEnabled.set(updated);
        log.info("Manager toggled Inactivity Email Alert preference to: {}", updated);
        return updated;
    }
}

