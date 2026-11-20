# Recept om het TISP Teamportaal op eender welke host te starten (uitleg: docs/hosting.md).
#   docker build -t teamportaal .
#   docker run -p 8000:8000 -v teamportaal-gegevens:/gegevens teamportaal
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY public ./public
ENV HOST=0.0.0.0 PORT=8000 GEGEVENS_MAP=/gegevens
RUN mkdir /gegevens && chown node:node /gegevens
USER node
VOLUME /gegevens
EXPOSE 8000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:${PORT}/health || exit 1
CMD ["node", "server/server.js"]
