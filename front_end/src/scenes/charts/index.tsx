import React, { useState, useEffect }  from 'react'
import { Box} from '@mui/material';
import DropdownButton from 'react-bootstrap/DropdownButton'
import Dropdown from 'react-bootstrap/Dropdown'
import Heatmap from './Heatmap'
import Calendar from './Calendar';
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import  "../../globals.css"

const index = () => {
  const [searchParams] = useSearchParams(); // Get URL search parameters
  const [portfolios, setPortfolios] = useState([]); // Portfolios list
  const initialPortfolio = searchParams.get("portfolio_name") || "Select Portfolio"; //initial value for the portfolio is either the param passed in the URL or 'Select Portfolio'
  const [selectedPortfolio, setSelectedPortfolio] = useState(initialPortfolio); // Selected portfolio
  const [data,setData]= useState([])
  
  
  // Fetch the list of portfolios
  useEffect(() => {
    // Fetch the list of portfolios
    axios.get("http://localhost:5000/portfolios")
      .then((response) => {
        setPortfolios(response.data); // Assuming response.data is an array of portfolio names
      })
      .catch((error) => {
        console.error("Error fetching portfolios:", error);
      });
  }, []);

  
  
  //fetch all the historical data of the investments within the portfolio to plot the charts
  useEffect(() => {

    // Fetch the chart data
    axios.get(`http://localhost:5000/chart-data?portfolio_name=${selectedPortfolio}`)
      .then((response) => {
        setData(response.data);//save the response to 'data' variable
      })
      .catch((error) => {
        console.error("Error fetching portfolios:", error);
      });
  }, [selectedPortfolio]);

  


  return (
    <div>
      <Box>
        <DropdownButton id="dropdown-basic-button" title={selectedPortfolio} className='select-portfolio-dropdown'>
            {portfolios.length > 0 ? (
                portfolios.map((portfolio, index) => (
                <Dropdown.Item key={index} onClick={() => setSelectedPortfolio(portfolio)}>{portfolio}</Dropdown.Item>
                ))
            ) : (
                <Dropdown.Item disabled>Loading...</Dropdown.Item>
            )}
        </DropdownButton>
      </Box>
      <Box sx={{marginTop: 10}}>
      {selectedPortfolio != "Select Portfolio" && (
        <div>
        <Heatmap ChartData={data} />
        
        
        </div>
      )}
      </Box>
      <Box sx={{marginTop: 10}}>
      {selectedPortfolio != "Select Portfolio" && (
        
        <div><Calendar ChartData={data}/> </div>
        
        
      )}
      </Box>
      
    </div>
  )
}

export default index