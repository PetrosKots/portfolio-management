FROM python:3.13-alpine

WORKDIR /ETL

COPY . .

RUN pip3 install pymysql yfinance pandas cryptography

CMD ["python3","create_db_schema.py"]