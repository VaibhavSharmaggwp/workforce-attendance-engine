# Stage 1: Build the Spring Boot Application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Configure Google Maven Central Mirror to eliminate rate limits (HTTP 429)
RUN mkdir -p /root/.m2
COPY settings.xml /root/.m2/settings.xml

# Copy POM and download dependencies
COPY pom.xml ./
RUN mvn dependency:go-offline -B -s /root/.m2/settings.xml || true

# Copy source code and package executable JAR
COPY src/ src/
RUN mvn clean package -DskipTests -B -s /root/.m2/settings.xml

# Stage 2: Minimal Production JRE Image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
