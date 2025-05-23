const path = require("path");
const { spawn } = require("child_process");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const yahooFinance = require("yahoo-finance2").default;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());



let USDToEURRate=1.095951;
// function that fetches the latest USD to EUR price and stores it into a variable
// the variables is used to convert currencies
async function getExchangeRates() {
  try {
    const response = await fetch('https://api.exchangeratesapi.io/v1/latest?access_key=33687c97909486ac7e4042ddc6156ce1');
    const data = await response.json();
    USDToEURRate = data.rates.USD
    console.log(`run and latest price is ${USDToEURRate} `)
    //return(data.rates.USD); //return the EUR to USD price
  } catch (error) {
    return 0;
  }
}


//initial run of the function

//getExchangeRates()

//while the server is running, update the price every 24 hours
setInterval(getExchangeRates,24*60*60*1000)

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:3306
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to the MySQL database.");
  }
});

// API Endpoint to fetch portfolio data
app.get("/portfolios", async (req, res) => {

  
  if(USDToEURRate === null){
    USDToEURRate=1
  }
  const { portfolio_name } = req.query;

  //if portfolio name is provided
  if (portfolio_name) {
    
    const query = `
    SELECT investment_id, data.company_id AS Company, quantity, average_price, recent_price.closing_price AS Last_Closing,
      CASE WHEN data.company_id != 'VUAA.MI' THEN Amount ELSE Amount*${USDToEURRate} END AS Amount_Invested,
      CASE WHEN data.company_id != 'VUAA.MI' THEN recent_price.closing_price ELSE recent_price.closing_price*${USDToEURRate} END AS Last_Closing_USD
    FROM
      (SELECT h1.company_id,h1.date,h1.closing_price
      FROM Historical_data h1
      INNER JOIN (
          SELECT company_id,MAX(date) as max_date
          FROM Historical_data
          GROUP BY company_id
          ) h2 ON h1.company_id=h2.company_id AND h1.date=h2.max_date) recent_price
      INNER JOIN (
        SELECT investment_id,company_id,quantity, average_price, quantity*average_price AS Amount 
        FROM Portfolios p 
        INNER JOIN (
          SELECT MAX(investment_id) AS investment_id,portfolio_id,company_id, CAST(SUM(CASE WHEN quantity>0 THEN average_price * quantity ELSE 0 END) / SUM(CASE WHEN quantity>0 THEN quantity ELSE 0 END) AS DECIMAL(5,2)) AS average_price ,SUM(quantity) AS quantity
          FROM Investments
          GROUP BY portfolio_id,company_id
          ) i ON p.portfolio_id=i.portfolio_id WHERE portfolio_name=?
      ) data ON recent_price.company_id=data.company_id

     `;
    db.query(query, [portfolio_name], (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        if (results.length === 0) {
          res.status(404).json({ error: "Portfolio not found" });
        } else {
          res.json(results);
        }
      }
    });
  } else {
    // If no portfolio_name is provided, return all portfolio names
    const query = "SELECT portfolio_name FROM Portfolios";
    db.query(query, (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const portfolioNames = results.map(item => item.portfolio_name);
        res.json(portfolioNames);
      }
    });
  }
});

// API Endpoint to add portfolio
app.post("/portfolios", (req, res) => {
  const { portfolio_name, date_created } = req.body;
  db.query(
    "INSERT INTO Portfolios (portfolio_name, date_created) VALUES (?, ?)",
    [portfolio_name, date_created],
    (err, results) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: results.insertId });
      }
    }
  );
});

//api endpoint to add investments
app.post("/portfolios/investments", (req, res) => {
  const { portfolio_name } = req.query;
  const investments = req.body.investments; // Expecting an array of investments
  
  // Retrieve the portfolio_id using the portfolio_name
  db.query(
    "SELECT portfolio_id FROM Portfolios WHERE portfolio_name=?",
    [portfolio_name],
    (err, results) => {
      
      if (err) {
        
        return res.status(500).json({ error: err.message });
      }
      
      // If portfolio exists, proceed with inserting multiple investments
      if (results.length > 0) {
        const portfolio_id = results[0].portfolio_id;
        
        // Prepare an array of values for batch insert
        const values = investments.map((investment) => [
          portfolio_id,
          investment.company_id,
          investment.date,
          parseFloat(investment.amount_invested)? parseFloat(investment.amount_invested) : null,
          parseFloat(investment.quantity)? parseFloat(investment.quantity) : null,
          parseFloat(investment.average_price)? parseFloat(investment.average_price) : null,
          parseFloat(investment.average_price_sold)? parseFloat(investment.average_price_sold) : null,
          parseFloat(investment.quantity_sold)? parseFloat(investment.quantity_sold) : null,
          parseFloat(investment.amount_sold)? parseFloat(investment.amount_sold) : null,
        ]);
        
        //Insert multiple rows into the Investments table
        const query = `
          INSERT INTO Investments (portfolio_id, company_id, date, amount_invested, quantity, average_price, average_price_sold, quantity_sold, amount_sold)
          VALUES ?
        `;

        db.query(query, [values], (err, insertResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          } else {
            // Respond with the number of inserted rows
            res.json({ insertedRows: insertResults.affectedRows });
          }
        });
      } else {
        // If no portfolio found, send a 404 error
        res.status(404).json({ error: "Portfolio not found" });
      }
    }
  );
});

//api endpoint to remove investments
app.delete("/portfolios/investments", (req, res) => {
  const {investment_id}=req.query //getting the id of the investment to delete
  int_id=parseInt(investment_id, 10) //parsing it to int

  //query to the remove the row
  db.query(
    "DELETE FROM Investments WHERE investment_id=?",
    [int_id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
    
    }
    )
});

app.delete("/portfolios/investments/remove", (req, res) => {

  const {portfolio_name,company_id}=req.query //getting the portfolio_id and company if of the investment to delete
  
  db.query(
    "SELECT portfolio_id FROM Portfolios WHERE portfolio_name=?",
    [portfolio_name],
    (err,results) =>{
      if (err) {
        
        return res.status(500).json({ error: err.message });

      }else if(results.length>0){
        const portfolio_id = results[0].portfolio_id

        
        db.query(
          "DELETE FROM Investments WHERE portfolio_id=? AND company_id=?",
          [portfolio_id,company_id],
          (err, results) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }else {
              res.json("Delete Completed ")
            }
          
          }
          )
      }
    }
  )

  
});

//endpoint to run python script that fetches the historical data and loads it to the database
app.post("/run-python", (req, res) => {
  const { companies, dates } = req.body; // Extract the company and date of investment arrays

  if( companies && dates){

  
    if (!Array.isArray(companies) || !Array.isArray(dates)) {
      return res.status(400).json({ error: "Invalid input format. Expected arrays." });
    }

    const scriptPath = path.join(__dirname, "./etl_data.py"); //path to the python file

    // Spawn the Python script
    const pythonProcess = spawn("python3", [scriptPath]); 

    // Send JSON data as parameters to Python via stdin
    pythonProcess.stdin.write(JSON.stringify({ companies, dates }));
    pythonProcess.stdin.end();

    

    // Handle errors
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python Error: ${data.toString()}`);
    });

    // When Python script finishes, send response back to frontend
    pythonProcess.on("close", (code) => {
      res.json({ output: 'success', exitCode: code });
    });
  
    }
  else{

    const scriptPath = path.join(__dirname, "./etl_data.py"); //path to the python file

    // Spawn the Python script
    const pythonProcess = spawn("python3", [scriptPath]); 

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python Error: ${data.toString()}`);
    });
    
    pythonProcess.stdout.on('data', data => {
      console.log(`stdout:\n${data}`);
    })

    pythonProcess.stdin.end();

    pythonProcess.on("close", (code) => {
      res.json({ output: 'success (no input)', exitCode: code });
    });
  }
});

//endpoint to delete portfolio
app.delete("/portfolios", (req, res) => {

  const {portfolio_name}=req.query //getting the portfolio name that needs to be deleted
  
  db.query(

    "SELECT portfolio_id FROM Portfolios WHERE portfolio_name=?", //get the portfolio id by the given name
    [portfolio_name],

    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // If portfolio exists, 
      if (results.length > 0){

        const portfolio_id = results[0].portfolio_id;

        const del_investments_query="DELETE FROM Investments WHERE portfolio_id=?" //query to delete the investments of the portfolio

        const del_portfolio_query="DELETE FROM Portfolios WHERE portfolio_id=?" //query to delete the portfolio


        db.query(del_investments_query, portfolio_id, (err, investmentResults) => { //firstly delete the investments
                                                                                    
          if (err) {
            return res.status(500).json({ error: err.message });
          } 

          db.query(del_portfolio_query, portfolio_id, (err, portfolioResults) => { //then delete the portfolio
            if (err) {
              return res.status(500).json({ error: err.message });
            } 
            res.json({ 
              
              deletedInvestments: investmentResults.affectedRows, //if everything successful send response
              deletedPortfolio: portfolioResults.affectedRows
            })
  
  
          }
          
          )
        }
      ) 
      }else {
        // If no portfolio found, send a 404 error
        res.status(404).json({ error: "Portfolio not found" });
      }
      }
    )
});

//endpoint to fecth the last closing price of a ticker

app.get("/last-closing", (req, res) => {

  if(USDToEURRate === null){
    USDToEURRate=1
  }
  const {companies}=req.query;
  

  const companyIdsArray = companies.split(",").map(id => id.trim()); // Convert string to array
  const placeholders = companyIdsArray.map(() => "?").join(",");

  const query = `
    SELECT h1.company_id AS Company, h1.closing_price,
      CASE WHEN h1.company_id != 'VUAA.MI' THEN h1.closing_price ELSE h1.closing_price*${USDToEURRate} END AS Last_Closing_USD
    FROM Historical_data h1
    JOIN (
        SELECT company_id, MAX(date) AS latest_date
        FROM Historical_data
        WHERE company_id IN (${placeholders})
        GROUP BY company_id
    ) h2 ON h1.company_id = h2.company_id AND h1.date = h2.latest_date
  `;

  db.query(query, companyIdsArray, (err, results) => {
    if (err) {
      console.error("Database Error:", err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json(results); // Return an array of results
  })

});


//endpoint to fetch the closing prices of the portfolio investments for this month
app.get("/closing/this-month", (req, res) => {
  const {portfolio_name}=req.query

  today=new Date()
  const first_of_this_month=new Date(today.getFullYear(), today.getMonth(), 1)

  db.query(
    "SELECT portfolio_id FROM Portfolios WHERE portfolio_name=?",
    [portfolio_name],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // If portfolio exists, proceed with inserting multiple investments
      if (results.length > 0) {
        const portfolio_id = results[0].portfolio_id;
        
        const query=`
        SELECT i.company_id,SUM(quantity) AS quantity,CAST( SUM(CASE WHEN quantity>0 THEN quantity*average_price ELSE 0 END) /SUM(CASE WHEN quantity>0 THEN quantity ELSE 0 END) AS DECIMAL(5,2)) as average_price,h3.date,MAX(closing_price)*${USDToEURRate} as closing_price
        FROM Investments i
        INNER JOIN
        (
          SELECT h1.company_id,portfolio_id,date,closing_price
          FROM(
            SELECT company_id,date,closing_price
            FROM Historical_data
            WHERE date>?) h1 
            INNER JOIN (SELECT DISTINCT company_id,portfolio_id FROM Investments WHERE portfolio_id=?  ) h2
            ON h1.company_id=h2.company_id
        ) h3 ON i.company_id=h3.company_id AND i.portfolio_id=h3.portfolio_id
         GROUP BY i.company_id,h3.date
            `;
      
        db.query(query, [first_of_this_month,portfolio_id], (err, insertResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          } else {
            // Respond with the number of inserted rows
            res.json(insertResults);
          }
        });
      } else {
        // If no portfolio found, send a 404 error
        res.status(404).json({ error: "Portfolio not found" });
      }
    }
  );
  

  

    
    
  
 

  
  

});


//api endpoint to get the historical data of a portfolios investments since the date of first investment 

app.get("/chart-data", (req, res) =>{

  const {portfolio_name}=req.query
  
  db.query(
    "SELECT portfolio_id FROM Portfolios WHERE portfolio_name=?",
    [portfolio_name],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // If portfolio exists, 
      if (results.length > 0) {
        const portfolio_id = results[0].portfolio_id
        
        const query=`
        SELECT T2.company_id,T2.date,T2.date=T1.date AS Is_Investment_date, average_price,quantity,amount_invested, average_price_sold,quantity_sold,amount_sold, closing_price,open_price,last_closing
        FROM 
          (
          SELECT company_id,date, average_price,quantity,amount_invested, average_price_sold,quantity_sold,amount_sold
          FROM Investments WHERE portfolio_id=? 
          ) T1 INNER JOIN 
          (
          SELECT company_id,date,open_price,closing_price,LAG(closing_price) OVER (PARTITION BY company_id ORDER BY date) AS last_closing
          FROM Historical_data
          ) T2 ON T1.company_id=T2.company_id
        WHERE T2.date>=T1.date
        
        `
      
        db.query(query, [portfolio_id], (err, insertResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          } else {
            // Respond with the number of inserted rows
            res.json(insertResults);
          }
        });
      } else {
        // If no portfolio found, send a 404 error
        res.status(404).json({ error: "Portfolio not found" });
      }
    }
  );

});

app.get("/portfolios/opening-and-last", (req,res) =>{

  const {portfolio_name}=req.query
  
  db.query("SELECT portfolio_id FROM Portfolios WHERE portfolio_name=?", [portfolio_name], 
    (err,response) => {

      if(err){

        return res.status(500).json({error: err.message})

      }else {

        if (response.length>0){
          const portfolio_id=response[0].portfolio_id
          
          const query=`
          SELECT T2.company_id, quantity, open_price, closing_price
          FROM 
          (
            SELECT *
            FROM Historical_data 
            WHERE date = 
              (
              SELECT MAX(date)
              FROM Historical_data
              
              )
            ) T1 INNER JOIN
            (SELECT company_id, SUM(quantity) AS quantity
            FROM Investments
            WHERE portfolio_id=?
            GROUP BY company_id
            ) T2 ON T1.company_id=T2.company_id
          `

          db.query(query, [portfolio_id], (err, insertResults) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            } else {
              // Respond with the number of inserted rows
              res.json(insertResults);
            }
          });
        }else {
          // If no portfolio found, send a 404 error
          res.status(404).json({ error: "Portfolio not found" });
        }

      }
    }
  )

})

//api end point to fecth S&P 500 historical data.
app.get("/historical/s&p500", async (req, res) => {

  //hiding a warning about historical() not working anymore
  //the library converts it to Chart() which is the functional one automatically
  yahooFinance.suppressNotices(['ripHistorical']);

  //getting the start and end date for the request
  const { start, end } = req.query;

  try {     //fetching the data of S&P for the desired date range
    const data = await yahooFinance.historical("^GSPC", {
      period1: start,
      period2: end,
      suppressNotices: ['ripHistorical']
    })

    //calculating the percentage increase/decrease for each day
    const result = data.slice(1).map((entry, i) => {
      const prevClose = data[i].close;
      const currClose = entry.close;
      const percentChange = ((currClose - prevClose) / prevClose) * 100;

      //returning the date, value at close and percentage change for each day
      return {
        date: entry.date.toISOString().split("T")[0],
        close: currClose,
        percentChange: +percentChange.toFixed(2),
      };
    });

    //sending the response
    res.json(result);

    //error handling
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch S&P 500 data." });
  }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
