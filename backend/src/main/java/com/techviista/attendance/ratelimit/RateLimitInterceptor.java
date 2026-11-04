package com.techviista.attendance.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    @Autowired(required = false)
    @Nullable
    private ProxyManager<String> proxyManager;

    private final Map<String, Bucket> inMemoryBuckets = new ConcurrentHashMap<>();

    public RateLimitInterceptor() {
    }

    public RateLimitInterceptor(@Nullable ProxyManager<String> proxyManager) {
        this.proxyManager = proxyManager;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String key = resolveKey(request);

        Bucket bucket;
        if (proxyManager != null) {
            try {
                // Define the rule: 20 requests per minute per user
                BucketConfiguration configuration = BucketConfiguration.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(20)
                                .refillGreedy(20, Duration.ofMinutes(1))
                                .build())
                        .build();
                bucket = proxyManager.builder().build(key, configuration);
            } catch (Exception ex) {
                bucket = getOrCreateInMemoryBucket(key);
            }
        } else {
            bucket = getOrCreateInMemoryBucket(key);
        }

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {
            response.addHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
            return true;
        } else {
            long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
            response.addHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
            response.sendError(HttpStatus.TOO_MANY_REQUESTS.value(), "You have exhausted your API Request Quota");
            return false;
        }
    }

    private Bucket getOrCreateInMemoryBucket(String key) {
        return inMemoryBuckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(20)
                        .refillGreedy(20, Duration.ofMinutes(1))
                        .build())
                .build());
    }

    private String resolveKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return "rate_limit:user:" + auth.getName();
        }
        return "rate_limit:ip:" + request.getRemoteAddr();
    }
}
