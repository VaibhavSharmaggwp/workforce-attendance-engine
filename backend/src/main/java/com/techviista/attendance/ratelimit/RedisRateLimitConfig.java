package com.techviista.attendance.ratelimit;

import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.Nullable;

import java.time.Duration;

@Slf4j
@Configuration
public class RedisRateLimitConfig {

    @Value("${spring.data.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.data.redis.port:6379}")
    private int redisPort;

    @Value("${spring.data.redis.password:}")
    private String redisPassword;

    @Bean(destroyMethod = "shutdown")
    public RedisClient redisClient() {
        boolean useSsl = redisHost != null && (redisHost.contains("upstash.io") || redisHost.contains("rediss://") || redisPort == 6380);
        RedisURI.Builder builder = RedisURI.builder()
                .withHost(redisHost)
                .withPort(redisPort)
                .withSsl(useSsl)
                .withTimeout(Duration.ofSeconds(5));

        if (redisPassword != null && !redisPassword.isBlank()) {
            builder.withPassword(redisPassword.toCharArray());
        }

        return RedisClient.create(builder.build());
    }

    @Bean(destroyMethod = "close")
    @Nullable
    public StatefulRedisConnection<String, byte[]> redisConnection(RedisClient redisClient) {
        try {
            log.info("Connecting to Redis at {}:{} (SSL: {})", redisHost, redisPort, redisHost.contains("upstash.io"));
            return redisClient.connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
        } catch (Exception ex) {
            log.warn("Could not connect to Redis at {}:{}. Rate limiting will fallback to in-memory gracefully. Error: {}",
                    redisHost, redisPort, ex.getMessage());
            return null;
        }
    }

    @Bean
    @Nullable
    public LettuceBasedProxyManager<String> proxyManager(@Nullable StatefulRedisConnection<String, byte[]> connection) {
        if (connection == null) {
            log.warn("Redis connection is null. Distributed rate limiting is disabled; using in-memory fallback.");
            return null;
        }
        try {
            return LettuceBasedProxyManager.builderFor(connection).build();
        } catch (Exception ex) {
            log.warn("Failed to initialize LettuceBasedProxyManager: {}. Using in-memory fallback.", ex.getMessage());
            return null;
        }
    }
}
