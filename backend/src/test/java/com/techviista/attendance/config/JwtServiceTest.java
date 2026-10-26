package com.techviista.attendance.config;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    // A secure 512-bit (64-byte) Base64 encoded secret key
    private final String secretKey = "5e58bb32852e173a0b6dabe03e6e5b28894f588ecdf1ed247438cfdb9fafc72028bce5a34cb4ead22d7460a788ddfcbd0c18d894b07306ec1c0d494ae0fde6c2";
    private final long accessTokenExpiration = 900000L; // 15 mins
    private final long refreshTokenExpiration = 604800000L; // 7 days

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", secretKey);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", accessTokenExpiration);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", refreshTokenExpiration);
    }

    @Test
    @DisplayName("Should generate a valid access token and extract the correct email")
    void generateAccessToken_and_extractEmail_Success() {
        String email = "john.doe@example.com";
        String token = jwtService.generateAccessToken(email);

        assertThat(token).isNotNull().isNotBlank();

        String extractedEmail = jwtService.extractEmail(token);
        assertThat(extractedEmail).isEqualTo(email);
    }


    @Test
    @DisplayName("Should generate a valid refresh token")
    void generateRefreshToken_Success() {
        String email = "jane.doe@example.com";
        String refreshToken = jwtService.generateRefreshToken(email);

        assertThat(refreshToken).isNotNull().isNotBlank();
        assertThat(jwtService.extractEmail(refreshToken)).isEqualTo(email);
    }

    @Test
    @DisplayName("Should return true when token is valid for the given email")
    void isTokenValid_ValidEmail_ReturnsTrue() {
        String email = "alice@example.com";
        String token = jwtService.generateAccessToken(email);

        boolean isValid = jwtService.isTokenValid(token, email);
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should return false when email does not match token subject")
    void isTokenValid_MismatchedEmail_ReturnsFalse() {
        String token = jwtService.generateAccessToken("alice@example.com");

        boolean isValid = jwtService.isTokenValid(token, "bob@example.com");
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should fail when token is expired")
    void isTokenExpired_ThrowsExpiredJwtException() {
        // Set expiration to negative (already expired)
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", -5000L);
        String token = jwtService.generateAccessToken("expired@example.com");

        // When parsing an expired token, JJWT throws ExpiredJwtException
        assertThatThrownBy(() -> jwtService.isTokenValid(token, "expired@example.com"))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("Should fail when token is signed with a different key")
    void tokenWithDifferentKey_ThrowsSignatureException() {
        String token = jwtService.generateAccessToken("tampered@example.com");

        // Configure a second JwtService with a different secret key
        JwtService anotherService = new JwtService();
        String differentSecret = Base64.getEncoder().encodeToString(new byte[64]);
        ReflectionTestUtils.setField(anotherService, "secretKey", differentSecret);
        ReflectionTestUtils.setField(anotherService, "jwtExpiration", accessTokenExpiration);
        ReflectionTestUtils.setField(anotherService, "refreshExpiration", refreshTokenExpiration);

        assertThatThrownBy(() -> anotherService.extractEmail(token))
                .isInstanceOf(SignatureException.class);
    }
}
