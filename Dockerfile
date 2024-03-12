# Используем образ Bun в качестве базового
FROM oven/bun:canary-slim

# Обновляем список пакетов и устанавливаем Nginx
RUN apt-get update && \
    apt-get install -y nginx openssl tar zip unzip && \
    rm -rf /var/lib/apt/lists/*

# Создаем директорию для PID файла и логов Nginx
RUN mkdir -p /run/nginx && \
    touch /run/nginx/nginx.pid && \
    mkdir -p /var/log/nginx

# Копируем конфигурацию Nginx
COPY environments/nginx/ /etc/nginx

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем исходный код приложения и статические файлы
COPY . .

# Устанавливаем генерацию сертификатов
RUN chmod +x environments/security/generate.zsh

# Устанавливаем зависимости и собираем проект
RUN bun install
COPY ./start.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/start.sh

# Чистим избыточные файлы для рантайма
RUN rm -rf ./client && rm -rf ./temp && rm -rf ./test && rm -rf server && rm -rf shared
RUN rm -rf ./node_modules && rm -rf ./bun.lockb && rm -rf ./package.json

# Открываем порты для Nginx и Bun
EXPOSE 80
EXPOSE 3001

# Создаем пользователя и группу для Nginx
RUN groupadd -r nginx && \
    useradd -r -g nginx -d /var/cache/nginx -s /sbin/nologin -c "Nginx web server" nginx

# Задаем точку входа
ENTRYPOINT ["/usr/local/bin/start.sh"]
