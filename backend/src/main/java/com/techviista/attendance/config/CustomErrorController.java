package com.techviista.attendance.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;

/**
 * Custom Error Controller: Overrides the default /error endpoint.
 * Whenever an unauthorized access, route mismatch, or OAuth redirect failure occurs on the backend,
 * this controller seamlessly redirects the user back to the frontend login page with a friendly error code.
 */
@Controller
public class CustomErrorController {

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @RequestMapping("/error")
    public void handleError(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String authError = request.getParameter("error");
        if (authError == null || authError.isBlank()) {
            authError = "account_not_linked";
        }
        response.sendRedirect(frontendUrl + "/login?error=" + authError);
    }
}
