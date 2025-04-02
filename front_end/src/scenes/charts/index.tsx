import React, { useState, useEffect }  from 'react'
import { Box} from '@mui/material';
import Heatmap from './Heatmap'
import Calendar from './Calendar';
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import  "../../globals.css"

const index = () => {
  const [searchParams] = useSearchParams(); // Get URL search parameters

  const selectedPortfolio = searchParams.get("portfolio_name") // get Selected Portfolio from url
  const [data,setData]= useState([])
  
  
  if(selectedPortfolio){
    //fetch all the historical data of the investments within the portfolio to plot the charts
    useEffect(() => {

      // Fetch the chart data
      axios.get(`http://localhost:5000/chart-data?portfolio_name=${selectedPortfolio}`)
        .then((response) => {
          setData(response.data);//save the response to 'data' variable
          console.log(response.data)
        })
        .catch((error) => {
          console.error("kala");
        });
    }, [selectedPortfolio]);
  }

  


  return (
    <div>
      
      <Box sx={{marginTop: 10}}>
        <div className='h1-bold'>Performance By Month</div>
      {selectedPortfolio && (
        <div>
        <Heatmap ChartData={data} />
        
        
        </div>
      )}
      </Box>
      <Box sx={{marginTop: 10}}>
      <div className='h1-bold'>Daily Performance Since Inception</div>
      {selectedPortfolio && data.length>1 &&(
        
        <div><Calendar ChartData={data}/> </div>
        
        
      )}
      </Box>
      
    </div>
  )
}

export default index