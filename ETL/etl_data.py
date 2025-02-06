import pymysql
import yfinance as yf
import pandas as pd
from datetime import date
from datetime import datetime
import sys
import json

#connection with the database
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Kalakala99!',  #Change to your password
    db='portfolio_management',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)


#function that returns the desired period to fetch data from yfinance
#based on the difference of the given date and today
#The given date is the date returned from the front and refers to the date that an investment was made
def CreatePeriod(given_date):

    difference_in_days=(date.today()-datetime.strptime(given_date, '%Y-%m-%d').date()).days #getting the differnce in day between the given day and today
    difference_in_years=difference_in_days/365
    
    if difference_in_years>10:
        return("max")
    elif difference_in_years>5 and difference_in_years <10:
        return("10y")
    
    elif difference_in_years>2 and difference_in_years<5:
        return('5y')
    elif difference_in_years>1 and difference_in_years<2:
        return('2y')
    else:
        difference_in_months=difference_in_days/30
        if difference_in_months>6:
            return("1y")
        elif difference_in_months>3 and difference_in_months<6:
            return('6mo')
        elif difference_in_months>1 and difference_in_months<3:
            return('3mo')
        else:
            return('1mo')
  
  
#Function that fetches the historical data from yahoo finance 
#for the given companies and the investment dates. Then it loads the data to the database.
#It only stores the closing price of the ticker for a given period.
#The period is calculated by calling the CreatePeriod function for the specific date.
#The CreatePeriod is necessary because the yfinance api call accepts a period value e.g 3mo and not a date.
def GetAndLoadHistoricalData(companies,dates):
    
    data=pd.DataFrame(list ( zip(companies,dates) ), columns=['Company', 'Date'] ) #Creating a dataframe by joining the two arrays to make iterations easier

    #iterating through the companies and dates, as the passed parameters are arrays of companies and dates 
    for index, row in data.iterrows() :


        company_info=yf.Ticker(row['Company']).info #fetching the info for the company
        name=company_info['longName'] #getting the full name of the company

        if 'sector' in company_info: #if there is a sector
            sector=company_info['sector'] #getting the sector of each company
        else:
            sector='ETF' #tickers with no sector are probably ETFs
        
        #get the historical data of the ticker for the desired period.Period accepts values like "1y" so we call the CreatePeriod function for the given date
        hist_data=yf.Ticker(row['Company']).history( period=CreatePeriod(row['Date']) )

        #creating a list of items like "AMZN-2024-01-31, AMZN , 2024-01-31, closing price"
        #the data_id "AMZN-2024-01-31" is used to avoid saving duplicate rows
        mylist=[ (row['Company'] + '-' + str(index), row['Company'], index, price,) for index,price in zip(hist_data['Close'].index, hist_data['Close'].values) ]
        
        with conn.cursor() as cursor:

            #inserting the company data into the database.Using Ignore to avoid duplicates
            cursor.execute("INSERT IGNORE INTO Companies (company_id,company_name,industry) VALUES(%s, %s, %s )",(row['Company'],name,sector))
            
            
            #inserting the historical closing price of the company into the database.Using Ignore to avoid duplicates.
            cursor.executemany("INSERT IGNORE INTO Historical_data (data_id,company_id,date,closing_price) VALUES (%s,%s, %s, %s) ",mylist)
                
            
            conn.commit()

if __name__ == "__main__":

    # Read JSON input from stdin
    input_data = sys.stdin.read()
    data = json.loads(input_data)

    # Extract arrays from JSON
    companies = data["companies"]
    dates = data["dates"]

    # Call function with the received data
    GetAndLoadHistoricalData(companies, dates)



    
