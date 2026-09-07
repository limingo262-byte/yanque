pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_SERVICE',
            choices: [
                'all',
                'yanque-admin',
                'yanque-ai',
                'bear-mcp',
                'admin-web',
                'student-web',
                'bear-mcp-web'
            ],
            description: '选择需要构建并发布的服务；all 发布全部六个应用服务'
        )
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        COMPOSE_FILE = '/opt/jenkins_home/workspace/yanque-mcp-deploy/deploy/docker-compose.prod.yml'
        COMPOSE_ENV_FILE = '/opt/yanque/.env'
        HOST_PROJECT_ROOT = '/opt/jenkins_home/workspace/yanque-mcp-deploy'
        IMAGE_TAG = "${BUILD_NUMBER}"
        COMPOSE_PROFILES = 'full'
    }

        stages {
        stage('Validate') {
            steps {
                sh '/usr/bin/docker compose --profile "$COMPOSE_PROFILES" -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" config --quiet'
            }
        }

        stage('Maven Compile') {
            when {
                expression { ['all', 'yanque-admin'].contains(params.DEPLOY_SERVICE) }
            }
            steps {
                sh '''
                    /usr/bin/docker run --rm \
                      -v "$HOST_PROJECT_ROOT/YanQue-Admin-14:/build" \
                      -w /build \
                      maven:3.9-eclipse-temurin-17 \
                      mvn -B -DskipTests compile
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    if [ "$DEPLOY_SERVICE" = "all" ]; then
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" build --pull
                    else
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" build --pull "$DEPLOY_SERVICE"
                    fi
                '''
            }
        }

        stage('Backup') {
            when {
                expression { ['all', 'yanque-admin', 'bear-mcp'].contains(params.DEPLOY_SERVICE) }
            }
            steps {
                sh '''
                    mkdir -p deploy/backup
                    /usr/bin/docker exec yanque-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases' > "deploy/backup/mysql-${BUILD_NUMBER}.sql" || true
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    if [ "$DEPLOY_SERVICE" = "all" ]; then
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" up -d --remove-orphans
                    else
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" \
                          up -d --no-deps --force-recreate "$DEPLOY_SERVICE"
                    fi
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '/usr/bin/docker compose --profile "$COMPOSE_PROFILES" -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" ps'
                sh '''
                    if [ "$DEPLOY_SERVICE" = "all" ]; then
                        containers="yanque-mysql yanque-redis yanque-admin yanque-ai bear-mcp yanque-admin-web yanque-student-web bear-mcp-web"
                    else
                        case "$DEPLOY_SERVICE" in
                            yanque-admin) containers="yanque-admin" ;;
                            yanque-ai) containers="yanque-ai" ;;
                            bear-mcp) containers="bear-mcp" ;;
                            admin-web) containers="yanque-admin-web" ;;
                            student-web) containers="yanque-student-web" ;;
                            bear-mcp-web) containers="bear-mcp-web" ;;
                            *) echo "unsupported service: $DEPLOY_SERVICE"; exit 1 ;;
                        esac
                    fi
                    for container in $containers; do
                        /usr/bin/docker inspect --format="{{.State.Status}}" "$container" | grep -q running
                    done
                '''
            }
        }

        stage('Interface Smoke Check') {
            when {
                expression { ['all', 'yanque-admin'].contains(params.DEPLOY_SERVICE) }
            }
            steps {
                sh '''
                    code=$(curl --silent --output /dev/null --write-out '%{http_code}' \
                      --request POST http://127.0.0.1/yq-admin/api/ops/logs/query || true)
                    test "$code" = "401"
                '''
            }
        }
    }

    post {
        always {
            sh '''
                if [ "$DEPLOY_SERVICE" = "all" ]; then
                    /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                      -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" logs --tail=120 > deploy/last-deploy.log || true
                else
                    /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                      -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" \
                      logs --tail=120 "$DEPLOY_SERVICE" > deploy/last-deploy.log || true
                fi
            '''
            archiveArtifacts artifacts: 'deploy/last-deploy.log', allowEmptyArchive: true
        }
    }
}
