FROM dockerfile/nodejs

MAINTAINER Simon Murtha Smith <simon@murtha-smith.com>

RUN apt-get install -y iptables

RUN echo "listen etcd 0.0.0.0:4001" > /etc/haproxy.cfg
RUN echo "  mode http" >> /etc/haproxy.cfg
RUN echo "  server 1 172.17.42.1:4001" >> /etc/haproxy.cfg

ADD . /app

# Install app dependencies
RUN cd /app; npm install

CMD haproxy -f /etc/haproxy.cfg -D && node /app/index.js
