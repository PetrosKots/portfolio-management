import yfinance as yf
import pandas as pd
import pymysql
import os
import pytz 
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

host=os.getenv("DB_HOST")
user=os.getenv("DB_USER")
password=os.getenv("DB_PASSWORD")
database=os.getenv("DB_NAME")
charset='utf8mb4'
cursorclass=pymysql.cursors.DictCursor
port=os.getenv("DB_PORT")


engine = create_engine(f'mysql+pymysql://{user}:{password}@{host}:{port}/{database}')

with engine.connect() as cursor:

    #inserting the company data into the database.Using Ignore to avoid duplicates
    response=cursor.execute(text("""SELECT T1.company_id,MIN(date) as date
                    FROM Companies T1 INNER JOIN (
                    SELECT portfolio_id,company_id, SUM(quantity) as quantity, MIN(date) as date
                    FROM Investments
                    GROUP BY portfolio_id,company_id) T2 on T1.company_id=T2.company_id WHERE quantity>0 
                    GROUP BY T1.company_id
                    """))
        
    result=pd.DataFrame(response.fetchall(), columns=response.keys())
    


    dividends_data=[]
    for row in result.itertuples():
            
            stock=yf.Ticker(row.company_id)
            dividends=stock.dividends
            dividends=dividends.reset_index()
            dividends.columns=['date','dividend_amount']
            dividends.date=pd.to_datetime(dividends.date).dt.date
            dividends=dividends[dividends.date>=row.date]
            if len(dividends)>0 :
                    df=dividends.reset_index()
                    df['company_id']=row.company_id
                    dividends_data.append(df)

    dividends_data=pd.concat(dividends_data,ignore_index=True)

    list_of_data=[]

dividends_data.to_sql('Dividends_History',con=engine,if_exists='replace',index=False)

