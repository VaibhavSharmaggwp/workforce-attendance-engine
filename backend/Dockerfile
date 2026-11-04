# Stage 1: Build the Spring Boot Application
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

# Copy Maven Wrapper and POM first to cache dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:resolve -B || true

# Copy source code and package executable JAR
COPY src/ src/
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal Production JRE Image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
