import React, { useState, useEffect }  from 'react'
import { Box} from '@mui/material';
import DropdownButton from 'react-bootstrap/DropdownButton'
import Dropdown from 'react-bootstrap/Dropdown'
import { useSearchParams } from "react-router-dom";
import { ResponsiveHeatMap } from '@nivo/heatmap'
import axios from "axios";

const data=[
    {
      "id": "Japan",
      "data": [
        {
          "x": "Train",
          "y": 74020
        },
        {
          "x": "Subway",
          "y": -6901
        },
        {
          "x": "Bus",
          "y": 48568
        },
        {
          "x": "Car",
          "y": -31241
        },
        {
          "x": "Boat",
          "y": 67111
        },
        {
          "x": "Moto",
          "y": 64784
        },
        {
          "x": "Moped",
          "y": 73965
        },
        {
          "x": "Bicycle",
          "y": 98531
        },
        {
          "x": "Others",
          "y": -44083
        }
      ]
    },
    {
      "id": "France",
      "data": [
        {
          "x": "Train",
          "y": 3771
        },
        {
          "x": "Subway",
          "y": 52159
        },
        {
          "x": "Bus",
          "y": -92682
        },
        {
          "x": "Car",
          "y": -45885
        },
        {
          "x": "Boat",
          "y": 73589
        },
        {
          "x": "Moto",
          "y": 27660
        },
        {
          "x": "Moped",
          "y": -53088
        },
        {
          "x": "Bicycle",
          "y": 919
        },
        {
          "x": "Others",
          "y": -31877
        }
      ]
    },
    {
      "id": "US",
      "data": [
        {
          "x": "Train",
          "y": 3373
        },
        {
          "x": "Subway",
          "y": -20143
        },
        {
          "x": "Bus",
          "y": 45024
        },
        {
          "x": "Car",
          "y": 55590
        },
        {
          "x": "Boat",
          "y": -85893
        },
        {
          "x": "Moto",
          "y": -97476
        },
        {
          "x": "Moped",
          "y": 45959
        },
        {
          "x": "Bicycle",
          "y": -25936
        },
        {
          "x": "Others",
          "y": 1201
        }
      ]
    }]
function Charts() {

    const [searchParams] = useSearchParams(); // Get URL search parameters
    const initialPortfolio = searchParams.get("portfolio_name") || "Select Portfolio"; //initial value for the portfolio is either the param passed in the URL or 'Select Portfolio'
    const [selectedPortfolio, setSelectedPortfolio] = useState(initialPortfolio); // Selected portfolio
    const [portfolios, setPortfolios] = useState([]); // Portfolios list

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
        <Box sx={{height:600}}>
        <ResponsiveHeatMap
            data={data}
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            valueFormat=">-.2s"
            axisTop={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -90,
                legend: '',
                legendOffset: 46,
                truncateTickAt: 0
            }}
            axisRight={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'country',
                legendPosition: 'middle',
                legendOffset: 70,
                truncateTickAt: 0
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'country',
                legendPosition: 'middle',
                legendOffset: -72,
                truncateTickAt: 0
            }}
            colors={{
                type: 'diverging',
                scheme: 'red_yellow_blue',
                divergeAt: 0.5,
                minValue: -100000,
                maxValue: 100000
            }}
            emptyColor="#555555"
            legends={[
                {
                    anchor: 'bottom',
                    translateX: 0,
                    translateY: 30,
                    length: 400,
                    thickness: 8,
                    direction: 'row',
                    tickPosition: 'after',
                    tickSize: 3,
                    tickSpacing: 4,
                    tickOverlap: false,
                    tickFormat: '>-.2s',
                    title: 'Value →',
                    titleAlign: 'start',
                    titleOffset: 4
                }
            ]}
        />
        </Box>
    </div>
  )
}

export default Charts