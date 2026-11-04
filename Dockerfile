# Stage 1: Build the Spring Boot Application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy POM and download dependencies
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B || true

# Copy source code and package executable JAR
COPY backend/src/ src/
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Production JRE Image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
