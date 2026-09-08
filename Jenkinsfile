def fixedServiceForJob() {
    def serviceByJob = [
        'yanque-admin-deploy': 'yanque-admin',
        'yanque-ai-deploy': 'yanque-ai',
        'bear-mcp-deploy': 'bear-mcp',
        'admin-web-deploy': 'admin-web',
        'student-web-deploy': 'student-web',
        'bear-mcp-web-deploy': 'bear-mcp-web'
    ]
    return serviceByJob[env.JOB_BASE_NAME]
}

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
            description: '全量任务可选择服务；六个独立任务会按 Job 名称固定发布对应服务'
        )
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        COMPOSE_FILE = "${WORKSPACE}/deploy/docker-compose.prod.yml"
        COMPOSE_ENV_FILE = '/opt/yanque/.env'
        // The Docker daemon runs on the host, so bind mounts must use the host
        // path even though Jenkins itself sees /var/jenkins_home.
        HOST_PROJECT_ROOT = "/opt/jenkins_home/workspace/${JOB_NAME}"
        IMAGE_TAG = "${BUILD_NUMBER}"
        COMPOSE_PROFILES = 'full'
    }

    stages {
        stage('Resolve Service') {
            steps {
                script {
                    env.EFFECTIVE_DEPLOY_SERVICE = fixedServiceForJob() ?: (params.DEPLOY_SERVICE ?: 'all')
                    echo "Deploy service: ${env.EFFECTIVE_DEPLOY_SERVICE}"
                }
            }
        }

        stage('Validate') {
            steps {
                sh '/usr/bin/docker compose --profile "$COMPOSE_PROFILES" -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" config --quiet'
            }
        }

        stage('Maven Compile') {
            when {
                expression { ['all', 'yanque-admin'].contains(env.EFFECTIVE_DEPLOY_SERVICE) }
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
                    if [ "$EFFECTIVE_DEPLOY_SERVICE" = "all" ]; then
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" build --pull
                    else
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" build --pull "$EFFECTIVE_DEPLOY_SERVICE"
                    fi
                '''
            }
        }

        stage('Backup') {
            when {
                expression { ['all', 'yanque-admin', 'bear-mcp'].contains(env.EFFECTIVE_DEPLOY_SERVICE) }
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
                    if [ "$EFFECTIVE_DEPLOY_SERVICE" = "all" ]; then
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" up -d --remove-orphans
                    else
                        /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                          -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" \
                          up -d --no-deps --force-recreate "$EFFECTIVE_DEPLOY_SERVICE"
                    fi
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '/usr/bin/docker compose --profile "$COMPOSE_PROFILES" -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" ps'
                sh '''
                    if [ "$EFFECTIVE_DEPLOY_SERVICE" = "all" ]; then
                        containers="yanque-mysql yanque-redis yanque-admin yanque-ai bear-mcp yanque-admin-web yanque-student-web bear-mcp-web"
                    else
                        case "$EFFECTIVE_DEPLOY_SERVICE" in
                            yanque-admin) containers="yanque-admin" ;;
                            yanque-ai) containers="yanque-ai" ;;
                            bear-mcp) containers="bear-mcp" ;;
                            admin-web) containers="yanque-admin-web" ;;
                            student-web) containers="yanque-student-web" ;;
                            bear-mcp-web) containers="bear-mcp-web" ;;
                            *) echo "unsupported service: $EFFECTIVE_DEPLOY_SERVICE"; exit 1 ;;
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
                expression { ['all', 'yanque-admin'].contains(env.EFFECTIVE_DEPLOY_SERVICE) }
            }
            steps {
                sh '''
                    code=000
                    for attempt in $(seq 1 30); do
                        code=$(/usr/bin/docker exec yanque-admin sh -c \
                          'curl --silent --output /dev/null --write-out "%{http_code}" \
                           --request POST http://127.0.0.1:8080/yq-admin/api/ops/logs/query' \
                          2>/dev/null || true)
                        if [ "$code" = "401" ]; then
                            exit 0
                        fi
                        sleep 2
                    done
                    echo "Admin interface smoke check returned HTTP $code after retries"
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            sh '''
                if [ "$EFFECTIVE_DEPLOY_SERVICE" = "all" ]; then
                    /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                      -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" logs --tail=120 > deploy/last-deploy.log || true
                else
                    /usr/bin/docker compose --profile "$COMPOSE_PROFILES" \
                      -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" \
                      logs --tail=120 "$EFFECTIVE_DEPLOY_SERVICE" > deploy/last-deploy.log || true
                fi
            '''
            archiveArtifacts artifacts: 'deploy/last-deploy.log', allowEmptyArchive: true
        }
    }
}
