pipeline {
    agent any
    
    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        DOCKERHUB_USERNAME = "ankitmori1626"
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/form-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/form-frontend"
        TAG = "latest"
        K8S_NAMESPACE = "three-tier-app"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build Backend') {
            steps {
                sh """
                    docker build -t ${BACKEND_IMAGE}:${TAG} backend/
                """
                
            }
        }
        stage('Build Frontend') {
            steps {
                sh """
                    docker build -t ${FRONTEND_IMAGE}:${TAG} frontend/
                """ 
            }
        }
        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', passwordVariable: 'DOCKERHUB_PASSWORD', usernameVariable: 'DOCKERHUB_USERNAME')]) {
                    sh """
                        echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
                        docker push ${BACKEND_IMAGE}:${TAG}
                        docker push ${FRONTEND_IMAGE}:${TAG}
                    """
                }
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                withKubeConfig([credentialsId: 'k8s-kubeconfig']) {
                    sh """
                        kubectl apply -k k8s-kubeadm/

                        kubectl set image deployment/backend-deployment backend=${BACKEND_IMAGE}:${TAG} -n ${K8S_NAMESPACE}
                        kubectl set image deployment/frontend-deployment frontend=${FRONTEND_IMAGE}:${TAG} -n ${K8S_NAMESPACE}

                        kubectl rollout status deployment/backend-deployment -n ${K8S_NAMESPACE}
                        kubectl rollout status deployment/frontend-deployment -n ${K8S_NAMESPACE}
                    """
                }    
            }
        }
    }

post {
        always {
            // Clean up dangling local images on Jenkins agent
            sh "docker rmi -f ${BACKEND_IMAGE}:${TAG} ${FRONTEND_IMAGE}:${TAG} || true"
        }
        success {
            echo "🎉 Pipeline execution completed successfully and deployed to Kubernetes!"
        }
        failure {
            echo "❌ Pipeline failed! Please check console logs."
        }
    }
}
