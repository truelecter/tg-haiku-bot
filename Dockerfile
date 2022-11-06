FROM node:14.20.1-slim

COPY . /opt/tg-haiku-bot/
WORKDIR /opt/tg-haiku-bot/

ENV NODE_ENV=prod

RUN npm install canvas@2.10.1 \
	&& npm install \
	&& npm run build \
	&& chown -R 1000:1000 /opt/tg-haiku-bot/ \
	&& apt update && apt -y install curl fontconfig p7zip-full \
	&& cd /tmp/ \
	&& curl -O https://devimages-cdn.apple.com/design/resources/download/SF-Pro.dmg \
	&& 7z x SF-Pro.dmg \
	&& cd SFProFonts \
	&& 7z x 'SF Pro Fonts.pkg' \
	&& 7z x 'Payload~' \
	&& mkdir -p /usr/share/fonts/opentype \
	&& mv Library/Fonts/* /usr/share/fonts/opentype \
	&& rm -rf /usr/local/share/.cache /tmp/* \
	&& fc-cache -f -v

USER 1000:1000

ENTRYPOINT ["/bin/sh", "-c", "npm start"]
