# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built artifact from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Set environment variables
ENV SPRING_DATA_MONGODB_URI=mongodb://mongo:27017/devtrackr
ENV SPRING_PROFILES_ACTIVE=prod

# Expose the port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]