import yfinance as yf
import pandas as pd
import pymysql
import pytz 
from sqlalchemy import create_engine, text



host='localhost'
user='root'
password='Kalakala99!'
database='portfolio_management'
port=3306


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

