FROM node:8

ADD package.json /srv/package.json
ADD package-lock.json /srv/package-lock.json
RUN cd /srv && npm ci --unsafe-perm && apt-get clean

ADD tsconfig.json /srv/tsconfig.json
ADD src /srv/src


RUN cd /srv/ && npm run build

WORKDIR /srv
CMD [ "npm", "start" ]

EXPOSE 80
