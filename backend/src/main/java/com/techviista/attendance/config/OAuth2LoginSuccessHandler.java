package com.techviista.attendance.config;

import com.techviista.attendance.employee.Employee;
import com.techviista.attendance.repository.EmployeeRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final JwtService jwtService;
    private final EmployeeRepository employeeRepository;
    private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.initial-manager.email:techviista53@gmail.com}")
    private String initialManagerEmail;

    @Value("${app.initial-manager.name:Mayank Verma}")
    private String initialManagerName;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        // Read originating redirect URI from cookie if present
        String redirectUriFromCookie = CookieUtils.getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(jakarta.servlet.http.Cookie::getValue)
                .orElse(null);

        // Always clean up authorization cookies on success
        cookieAuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String rawEmail = oAuth2User.getAttribute("email");
        String email = rawEmail != null ? rawEmail.trim().toLowerCase() : "";

        String baseToUse = (redirectUriFromCookie != null && !redirectUriFromCookie.isBlank())
                ? redirectUriFromCookie
                : frontendUrl;
        String cleanBase = baseToUse != null ? baseToUse.replaceAll("/+$", "") : "";
        String redirectBase = cleanBase.isEmpty() ? "/" : cleanBase + "/";

        Optional<Employee> employeeOpt = employeeRepository.findByEmailIgnoreCase(email);

        // Auto-provision manager if configured manager logs in
        if (employeeOpt.isEmpty() && isConfiguredManager(email)) {
            String name = oAuth2User.getAttribute("name");
            if (name == null || name.isBlank()) {
                name = initialManagerName;
            }
            Employee manager = employeeRepository.save(Employee.builder()
                    .fullName(name)
                    .email(email)
                    .role(com.techviista.attendance.employee.EmployeeRole.MANAGER)
                    .isActive(true)
                    .build());
            employeeOpt = Optional.of(manager);
        }

        if (employeeOpt.isEmpty()) {
            // UI Rule: Redirect to "Account Not Linked" frontend page with attempted email
            String encodedEmail = !email.isEmpty() ? java.net.URLEncoder.encode(email, java.nio.charset.StandardCharsets.UTF_8) : "";
            getRedirectStrategy().sendRedirect(request, response, redirectBase + "?error=account_not_linked&email=" + encodedEmail);
            return;
        }

        Employee employee = employeeOpt.get();
        String accessToken = jwtService.generateAccessToken(employee.getEmail());
        String refreshToken = jwtService.generateRefreshToken(employee.getEmail());

        // Redirect to the frontend application, passing the tokens and profile details safely
        String targetUrl = redirectBase + "?accessToken=" + accessToken
                + "&refreshToken=" + refreshToken
                + "&email=" + java.net.URLEncoder.encode(employee.getEmail(), java.nio.charset.StandardCharsets.UTF_8)
                + "&name=" + java.net.URLEncoder.encode(employee.getFullName(), java.nio.charset.StandardCharsets.UTF_8)
                + "&role=" + employee.getRole().name();
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private boolean isConfiguredManager(String email) {
        if (email == null || email.isBlank()) return false;
        String clean = email.trim().toLowerCase();
        return clean.equalsIgnoreCase(initialManagerEmail)
                || clean.equals("techviista53@gmail.com");
    }
}
