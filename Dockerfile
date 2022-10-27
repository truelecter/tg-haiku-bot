FROM node:14.20.1-slim

COPY . /opt/tg-haiku-bot/
WORKDIR /opt/tg-haiku-bot/

ENV NODE_ENV=prod

RUN npm install canvas@2.10.1 \
	&& npm install \
	&& npm run build \
  && chown -R 1000:1000 /opt/tg-haiku-bot/ \
	&& rm -rf /usr/local/share/.cache /tmp/*

USER 1000:1000

ENTRYPOINT ["/bin/sh", "-c", "npm start"]
