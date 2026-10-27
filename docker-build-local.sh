#!/bin/bash

docker run -d \
  --name homefinance-app \
  --network backend-network \
  -p 4201:80 \
  --restart unless-stopped \
  homefinance-app:latest