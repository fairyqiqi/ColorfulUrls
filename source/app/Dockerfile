FROM node:6.3.1

RUN npm install nodemon -g

RUN mkdir -p /root/colorfulUrl

WORKDIR /root/colorfulUrl

ADD . /root/colorfulUrl

RUN cd /root/colorfulUrl

RUN npm install

EXPOSE 7777

CMD ["nodemon", "/root/colorfulUrl/server.js"]