pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        COMPOSE_FILE = 'deploy/docker-compose.prod.yml'
        COMPOSE_ENV_FILE = '/opt/yanque/.env'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        stage('Validate') {
            steps {
                sh 'docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" config --quiet'
            }
        }

        stage('Build Images') {
            steps {
                sh 'docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" build --pull'
            }
        }

        stage('Backup') {
            steps {
                sh 'mkdir -p deploy/backup && docker exec yanque-mysql sh -c '\''mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases'\'' > deploy/backup/mysql-${BUILD_NUMBER}.sql || true'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" up -d --remove-orphans'
            }
        }

        stage('Health Check') {
            steps {
                sh 'docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" ps'
                sh 'docker inspect --format="{{.State.Status}}" yanque-ai | grep -q running'
                sh 'docker inspect --format="{{.State.Status}}" yanque-admin | grep -q running'
                sh 'docker inspect --format="{{.State.Status}}" bear-mcp | grep -q running'
            }
        }
    }

    post {
        always {
            sh 'docker compose -f "$COMPOSE_FILE" --env-file "$COMPOSE_ENV_FILE" logs --tail=120 > deploy/last-deploy.log || true'
            archiveArtifacts artifacts: 'deploy/last-deploy.log', allowEmptyArchive: true
        }
    }
}
