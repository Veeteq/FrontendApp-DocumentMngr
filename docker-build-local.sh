#!/bin/bash

docker run -d \
  --name documentmngr-frontend \
  --network backend-network \
  -p 4201:80 \
  --restart unless-stopped \
  documentmngr-frontend:latest