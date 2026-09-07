pipeline {
    agent any

    parameters {
        choice(name: 'DEPLOY_PROFILE', choices: ['mcp', 'full'], description: 'mcp 仅部署 MCP；full 部署全部服务')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        COMPOSE_FILE = '/opt/jenkins_home/workspace/yanque-mcp-deploy/deploy/docker-compose.prod.yml'
        COMPOSE_ENV_FILE = '/opt/yanque/.env'
        IMAGE_TAG = "${BUILD_NUMBER}"
        COMPOSE_PROFILES = "${params.DEPLOY_PROFILE}"
    }

        stages {
        stage('Validate') {
            steps {
                sh '/usr/bin/docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" config --quiet'
            }
        }

        stage('Maven Compile') {
            steps {
                dir('YanQue-Admin-14') {
                    sh 'mvn -B -DskipTests compile'
                }
            }
        }

        stage('Build Images') {
            steps {
                sh '/usr/bin/docker compose --profile "$COMPOSE_PROFILES" -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" build --pull'
            }
        }

        stage('Backup') {
            steps {
                sh '''
                    mkdir -p deploy/backup
                    /usr/bin/docker exec yanque-mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases' > "deploy/backup/mysql-${BUILD_NUMBER}.sql" || true
                '''
            }
        }

        stage('Deploy') {
            steps {
                sh '/usr/bin/docker compose --profile "$COMPOSE_PROFILES" -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" up -d --remove-orphans'
            }
        }

        stage('Health Check') {
            steps {
                sh '/usr/bin/docker compose --profile "$COMPOSE_PROFILES" -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" ps'
                sh '''
                    /usr/bin/docker inspect --format="{{.State.Status}}" bear-mcp | grep -q running
                    /usr/bin/docker inspect --format="{{.State.Status}}" yanque-mysql | grep -q running
                    if [ "$COMPOSE_PROFILES" = "full" ]; then
                        /usr/bin/docker inspect --format="{{.State.Status}}" yanque-ai | grep -q running
                        /usr/bin/docker inspect --format="{{.State.Status}}" yanque-admin | grep -q running
                    fi
                '''
            }
        }

        stage('Interface Smoke Check') {
            when {
                expression { params.DEPLOY_PROFILE == 'full' }
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
            sh '/usr/bin/docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" logs --tail=120 > deploy/last-deploy.log || true'
            archiveArtifacts artifacts: 'deploy/last-deploy.log', allowEmptyArchive: true
        }
    }
}
