FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && mkdir -p /var/data/blackstone && chown -R node:node /var/data/blackstone
COPY --chown=node:node platform ./platform
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4174 DATA_DIR=/var/data/blackstone
EXPOSE 4174
VOLUME ["/var/data/blackstone"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","--env-file-if-exists=.env","platform/server.mjs"]
