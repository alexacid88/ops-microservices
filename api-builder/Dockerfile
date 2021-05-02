FROM nginx
WORKDIR /app
COPY ./src/app/package*.json ./
COPY ./src/app/app.js ./
COPY ./src/servers/default.conf /etc/nginx/conf.d/
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs
RUN npm install
RUN npm install pm2 -g
EXPOSE 8081

CMD ["pm2-runtime", "app.js"]


