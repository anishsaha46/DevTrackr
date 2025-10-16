# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS builder

# Create a custom settings file to increase timeouts
RUN echo '<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd"><mirrors><mirror><id>central</id><name>central</name><url>https://repo.maven.apache.org/maven2</url><mirrorOf>*</mirrorOf></mirror></mirrors></settings>' > /usr/share/maven/conf/settings.xml

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Build the application with increased timeout and retries
RUN mvn clean package -DskipTests --settings /usr/share/maven/conf/settings.xml -Dmaven.wagon.http.pool=false -Dmaven.wagon.http.retryHandler.count=3

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