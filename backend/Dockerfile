FROM node:8.12


ADD package.json /srv/package.json
ADD package-lock.json /srv/package-lock.json
RUN cd /srv && npm ci --unsafe-perm && apt-get clean

ADD src /srv/src
RUN cd /srv/ && npm run tsc

EXPOSE 80
