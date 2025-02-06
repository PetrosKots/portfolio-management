const path = require("path");
const { spawn } = require("child_process");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to the MySQL database.");
  }
});

// API Endpoint to fetch portfolio data
app.get("/portfolios", (req, res) => {
  const { portfolio_name } = req.query;

  //if portfolio name is provided
  if (portfolio_name) {
    
    const query = `
    SELECT investment_id, data.company_id AS Company, quantity, average_price, Amount, recent_price.closing_price AS "Last Closing"
    FROM
      (SELECT h1.company_id,h1.date,h1.closing_price
      FROM Historical_data h1
      INNER JOIN (
          SELECT company_id,MAX(date) as max_date
          FROM Historical_data
          GROUP BY company_id
          ) h2 ON h1.company_id=h2.company_id AND h1.date=h2.max_date) recent_price
      INNER JOIN (
        SELECT investment_id,company_id,quantity, average_price, amount_invested AS Amount 
        FROM Portfolios p 
        INNER JOIN Investments i ON p.portfolio_id=i.portfolio_id WHERE portfolio_name=?
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
          parseFloat(investment.amount_invested),
          parseFloat(investment.quantity),
          parseFloat(investment.average_price)
        ]);
        //Insert multiple rows into the Investments table
        const query = `
          INSERT INTO Investments (portfolio_id, company_id, date, amount_invested, quantity, average_price)
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

//endpoint to run python script that fetches the historical data and loads it to the database
app.post("/run-python", (req, res) => {
  const { companies, dates } = req.body; // Extract the company and date of investment arrays

  if (!Array.isArray(companies) || !Array.isArray(dates)) {
    return res.status(400).json({ error: "Invalid input format. Expected arrays." });
  }

  const scriptPath = path.join(__dirname, "../ETL/etl_data.py"); //path to the python file

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
  const {companies}=req.query;
  

  const companyIdsArray = companies.split(",").map(id => id.trim()); // Convert string to array
  const placeholders = companyIdsArray.map(() => "?").join(",");

  const query = `
    SELECT h1.company_id AS Company, h1.closing_price
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
        SELECT i.company_id,quantity,average_price,h3.date,closing_price
        FROM Investments i
        INNER JOIN
        (
          SELECT h1.company_id,date,closing_price
          FROM(
            SELECT company_id,date,closing_price
            FROM Historical_data
            WHERE date>?) h1 
            INNER JOIN (SELECT company_id FROM Investments WHERE portfolio_id=?  ) h2
            ON h1.company_id=h2.company_id
        ) h3 ON i.company_id=h3.company_id 
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
