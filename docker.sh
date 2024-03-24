#!/bin/sh

docker build -f ./Dockerfile -t fckffln/service-template:latest ./
docker run -dit --name=service-template -p 3002:3001 --restart=always fckffln/service-template:latest
