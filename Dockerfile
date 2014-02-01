FROM dockerfile/nodejs

MAINTAINER Simon Murtha Smith <simon@murtha-smith.com>

# for running test, install istanbul and mocha
RUN npm install -g istanbul
RUN npm install -g mocha
RUN ln -s /usr/lib/node_modules/istanbul/lib/cli.js /usr/local/bin/istanbul

ADD . /app

# Install app dependencies
RUN cd /app; npm install

ENV NODE_PATH lib
WORKDIR /app
CMD ["node", "index.js", "--etcd-host", "172.17.42.1"]
