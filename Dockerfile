# Используем образ Bun в качестве базового
FROM oven/bun:canary-slim as build

# Обновляем список пакетов и устанавливаем Nginx
RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем исходный код приложения и статические файлы
COPY . .

# Устанавливаем генерацию сертификатов
RUN chmod +x environments/security/generate.zsh
RUN chmod +x install.sh

# Устанавливаем зависимости и собираем проект
RUN ./install.sh

FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y nginx tar zip unzip curl && \
    rm -rf /var/lib/apt/lists/*

# Создаем директорию для PID файла и логов Nginx
RUN mkdir -p /run/nginx && \
    touch /run/nginx/nginx.pid && \
    mkdir -p /var/log/nginx

# Копируем конфигурацию Nginx
COPY --from=build /usr/src/app/environments/nginx/ /etc/nginx

COPY --from=build /usr/src/app/start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh

COPY --from=build /usr/src/app/main /usr/src/app/
COPY --from=build /usr/src/app/environments /usr/src/app/environments
RUN rm -rf /usr/src/app/environments/nginx
COPY --from=build /usr/src/app/client_modules /usr/src/app/client_modules
COPY --from=build /usr/src/app/assets /usr/src/app/assets

# Открываем порты для Nginx и Bun
EXPOSE 80
EXPOSE 3001

# Создаем пользователя и группу для Nginx
RUN groupadd -r nginx && \
    useradd -r -g nginx -d /var/cache/nginx -s /sbin/nologin -c "Nginx web server" nginx

WORKDIR /usr/src/app

# Задаем точку входа
ENTRYPOINT ["/usr/local/bin/start.sh"]
