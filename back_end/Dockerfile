FROM node:23.5-alpine

RUN apk add --no-cache python3 py3-pip py3-virtualenv

WORKDIR /back_end


COPY package.json .


RUN npm install


COPY . .


RUN python3 -m venv /venv \
    && . /venv/bin/activate \
    && pip install pymysql yfinance pandas cryptography

# Set PATH so your Node app can run python from the venv
ENV PATH="/venv/bin:$PATH"

EXPOSE 5000


CMD ["node", "index.js"]


