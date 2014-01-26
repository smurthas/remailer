FROM dockerfile/nodejs

MAINTAINER Simon Murtha Smith <simon@murtha-smith.com>

ADD . /app

# Install app dependencies
RUN cd /app; npm install

ENV NODE_PATH lib
CMD ["node", "/app/index.js", "--etcd-host", "172.17.42.1"]
