FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline
COPY . .
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /build/target/*.jar /app/app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=55", "-jar", "/app/app.jar"]
