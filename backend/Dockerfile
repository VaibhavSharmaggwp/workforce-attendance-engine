# Stage 1: Build the Spring Boot Application
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

ENV MAVEN_OPTS="-Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.http.pool=false -Dhttp.keepAlive=false -Dmaven.wagon.http.timeout=60000"

# Copy Maven Wrapper and POM first to cache dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B --no-transfer-progress || true

# Copy source code and package executable JAR
COPY src/ src/
RUN ./mvnw package -DskipTests -B --no-transfer-progress

# Stage 2: Minimal Production JRE Image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]
