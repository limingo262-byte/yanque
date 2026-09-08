FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml .
RUN mkdir -p /root/.m2 && printf '%s\n' '<settings><mirrors><mirror><id>aliyun</id><mirrorOf>*</mirrorOf><name>Aliyun Maven</name><url>https://maven.aliyun.com/repository/public</url></mirror></mirrors></settings>' > /root/.m2/settings.xml
RUN mvn -B -DskipTests dependency:go-offline
COPY . .
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre
RUN apt-get update && apt-get install -y --no-install-recommends ripgrep sed coreutils && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /build/target/*.jar /app/app.jar
EXPOSE 8090
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=55", "-jar", "/app/app.jar"]
