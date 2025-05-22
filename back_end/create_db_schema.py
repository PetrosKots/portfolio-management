import pymysql
import os
import time

#for use in deployment with docker compose
"""
conn = pymysql.connect(
    host='database',
    user='test',
    password='mypass',
    database='portfolio_management',
    port=3306,
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
"""

# for use in dev mode
conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Kalakala99!',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

try:
    with conn.cursor() as cursor:

        #SQL queries to create the database schema

        Create_Companies = ("CREATE TABLE IF NOT EXISTS Companies (" 
        "company_id VARCHAR(10) PRIMARY KEY," 
        "company_name VARCHAR(255)," 
        "industry VARCHAR(255))"  )

        Create_Portfolios = (
        "CREATE TABLE IF NOT EXISTS Portfolios (" 
        "portfolio_id INT AUTO_INCREMENT  PRIMARY KEY, "
        "portfolio_name VARCHAR(255), "
        "date_created DATE )" )

        Create_Investments = (
        "CREATE TABLE IF NOT EXISTS Investments ("
        "investment_id INT AUTO_INCREMENT PRIMARY KEY, "
        "portfolio_id INT, "
        "company_id VARCHAR(10), "
        "date DATE, "
        "average_price FLOAT,"
        "quantity FLOAT,"
        "amount_invested INT, "
        "average_price_sold FLOAT,"
        "quantity_sold FLOAT,"
        "amount_sold FLOAT,"
        "FOREIGN KEY (portfolio_id) REFERENCES Portfolios(portfolio_id))"
        
    )

        Create_Historical_data = (
        "CREATE TABLE IF NOT EXISTS Historical_data ("
        "data_id VARCHAR(255) PRIMARY KEY, "
        "company_id VARCHAR(10), "
        "date DATE, "
        "open_price FLOAT, "
        "closing_price FLOAT, " 
        "FOREIGN KEY (company_id) REFERENCES Companies(company_id))"
        )

        Create_Dividends_History = (
        "CREATE TABLE IF NOT EXISTS Dividends_History ("
        "dividend_amount FLOAT, "
        "company_id VARCHAR(10), "
        "date DATE, " 
        "FOREIGN KEY (company_id) REFERENCES Companies(company_id))"
        )

        queries=[Create_Companies,Create_Portfolios,Create_Investments,Create_Historical_data,Create_Dividends_History]

        #Create the database
        cursor.execute("CREATE DATABASE IF NOT EXISTS portfolio_management")
        #connect to the new database
        cursor.execute("USE portfolio_management")
        for i in queries:
            cursor.execute(i)

    # Commit changes
    conn.commit()

    print("Database Created successfully")
finally:
    conn.close()

