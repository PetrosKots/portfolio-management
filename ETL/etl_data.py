import pymysql
import yfinance

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Kalakala99!',  #Change to your password
    db='portfolio_management',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)


with conn.cursor() as cursor:

    #get all the date of first investment for each company in all the portfolio
    cursor.execute(
        "SELECT portfolio_name,company_id,MIN(date)"
        "FROM Portfolios p NATURAL JOIN Investments i"
        "GROUP BY portfolio_name,company_id"
        
        )
    portfolios = [cursor.fetchall()]


    
    
