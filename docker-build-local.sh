#!/bin/bash

set -euo pipefail

APP_NAME=documentmngr-frontend
IMAGE_NAME=documentmngr-frontend
IMAGE_TAG=latest

NETWORK_NAME=backend-network

HOST_NAME=localhost
HOST_PORT=4201
CONTAINER_PORT=80

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command '$1' was not found."
}

echo "Checking prerequisites..."

require_command docker
require_command curl

docker info >/dev/null 2>&1 || fail "Docker Desktop is not running."

echo
echo "Deployment configuration:"
echo " Application : ${APP_NAME}"
echo " Image       : ${IMAGE_NAME}:${IMAGE_TAG}"
echo " Network     : ${NETWORK_NAME}"
echo " Host port   : ${HOST_PORT}"
echo " Container   : ${CONTAINER_PORT}"
echo

echo "Configuring Docker network..."

if ! docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
  echo "Creating Docker network '${NETWORK_NAME}'..."
  docker network create "${NETWORK_NAME}"
else
  echo "Docker network '${NETWORK_NAME}' already exists."
fi

echo "Building Docker image..."

docker build \
  --progress=plain \
  -t "${IMAGE_NAME}:${IMAGE_TAG}" \
  -f Dockerfile .

echo "Removing previous container..."

docker rm -f "${APP_NAME}" 2>/dev/null || true

echo "Starting container..."

docker run -d \
  --name "${APP_NAME}" \
  --network "${NETWORK_NAME}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "${IMAGE_NAME}:${IMAGE_TAG}"

echo "Waiting for frontend..."

URL="http://${HOST_NAME}:${HOST_PORT}/"
MAX_ATTEMPTS=30
SLEEP_SECONDS=2

for ((i=1; i<=MAX_ATTEMPTS; i++)); do
  echo "Health check attempt ${i}/${MAX_ATTEMPTS}"

  if curl --silent --fail "${URL}" >/dev/null 2>&1; then
    echo
    echo "${APP_NAME} is ready."
    echo "Application: ${URL}"
    echo
    exit 0
  fi

  sleep "${SLEEP_SECONDS}"
done

echo
echo "ERROR: ${APP_NAME} did not become ready."
echo
echo "Container status:"
docker ps -a --filter "name=${APP_NAME}"

echo
echo "Last container logs:"
docker logs --tail 100 "${APP_NAME}"

exit 1