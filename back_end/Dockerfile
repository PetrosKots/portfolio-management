FROM node:23.5-alpine

RUN apk add --no-cache python3 py3-pip py3-virtualenv bash

WORKDIR /back_end


COPY package.json .


RUN npm install


COPY . .


RUN python3 -m venv /venv \
    && . /venv/bin/activate \
    && pip install pymysql yfinance pandas cryptography sqlalchemy

# Set PATH so your Node app can run python from the venv

COPY wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

ENV PATH="/venv/bin:$PATH"

EXPOSE 5000


CMD bash -c "/wait-for-it.sh mysql_db:3306 --timeout=30 --strict -- \
    python3 create_db_schema.py && node index.js"



