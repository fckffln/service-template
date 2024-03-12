#!/bin/sh

./main

# Запуск Nginx в фоновом режиме
nginx -g 'daemon off;'
