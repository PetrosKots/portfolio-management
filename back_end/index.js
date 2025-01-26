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

// API Endpoint to get data portfolio data
app.get("/portfolios", (req, res) => {
  const { portfolio_name } = req.query;

  //if portfolio name is provided
  if (portfolio_name) {
    
    const query = "SELECT company_id,amount_invested,date FROM Portfolios p INNER JOIN Investments i ON p.portfolio_id=i.portfolio_id WHERE portfolio_name=?";
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
          parseFloat(investment.amount_invested)
        ]);
        //Insert multiple rows into the Investments table
        const query = `
          INSERT INTO Investments (portfolio_id, company_id, date, amount_invested)
          VALUES ?
        `;

        db.query(query, [values], (err, insertResults) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          } else {
            // Step 4: Respond with the number of inserted rows
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



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
