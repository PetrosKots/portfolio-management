import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef, gridClasses, GridToolbarContainer, GridCellParams } from '@mui/x-data-grid';
import { Button as BootstrapButton } from 'react-bootstrap';
import { Button as MuiButton } from '@mui/material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import AddIcon from '@mui/icons-material/Add';
import Popup from "./popups/create_portfolio_popup";
import TickerPopup from './popups/add_ticker_popup';
import DeletePortfolioPopup from './popups/delete_portfolio_popup';
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {Alert, Snackbar} from '@mui/material';
import { ResponsivePie } from '@nivo/pie'
import { useMemo } from "react";
import * as motion from "motion/react-client"
import { animate, useMotionValue, useTransform } from "motion/react"
import  "../../globals.css"


// Define PortfolioData type to be flexible
interface PortfolioData {
  [key: string]: any;
}

type PieChartData = {
  id: string;
  value: number;
  label : string
};

const Portfolios = () => {

  //style of the animation box
  const box = {
    marginTop:"5%",
    width: 500,
    height: 500,
    backgroundColor: "#1F2A40",
    borderRadius: 5,
  }
  
  const [searchParams] = useSearchParams(); // Get URL search parameters
  const initialPortfolio = searchParams.get("portfolio_name") || "Select Portfolio"; // Get the portfolio name from URL
                                                                                    // If there is no portfolio name, keep the initial value
  const [portfolios, setPortfolios] = useState([]); // Portfolios list
  const [selectedPortfolio, setSelectedPortfolio] = useState(initialPortfolio); // Selected portfolio
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]); // Data for DataGrid
  const [columns, setColumns] = useState<GridColDef[]>([]); // Dynamic columns for DataGrid
  const [openPortfolioPopup, setOpenPortfolioPopup] = useState(false); // State to control popup
  const [openTickerPopup, setOpenTickerPopup] = useState(false); // State for Ticker Popup
  const [openDeleteTickerPopup, setOpenDeletePortfolioPopup] = useState(false); // State for Ticker Popup
  const [alertOpen, setAlertOpen] = useState(false); //use state for the alert message
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false); //use state for the alert message
  // Track selected rows for deletion
  const [selectedRows, setSelectedRows] = useState<number[]>([]); // Store selected rows for deletion
  const [data,setData]=useState<PortfolioData[]>([])
  const [closingPrices, setClosingPrices] = useState<any>(null);
  const [thisMonthData, setThisMonthData] = useState<any>(null);
  
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

  useEffect(() => {
    // Fetch portfolio data if a portfolio is selected

    if (selectedPortfolio) {
      axios.get<PortfolioData[]>(`http://localhost:5000/portfolios?portfolio_name=${selectedPortfolio}`)
        .then(response => {
          if (response.data.length > 0) {
            const firstRow = response.data[0];
            
            // Dynamically creating new columns for the data grid table based on
            // the number of columns returned by the API response
            const newColumns: GridColDef[] = Object.keys(firstRow)
            .filter((key) => key !== "investment_id") // Exclude the ID column
            .map((key) => ({
              field: key,
              headerName: key.replace(/_/g, " ").toUpperCase(),
              width: 150,
              editable: false
            }));
            
            //add extra custom columns to the datagrid 
            const extraColumns: GridColDef[] = [
              {
                  field: "performance", 
                  headerName: "PERFORMANCE", 
                  width: 150, 
                  editable: false
              }]
            
            // concatenating the columns returned from the API call and the custom created columns
            const allColumns = [...newColumns, ...extraColumns];
            
            // Ensure each row has an "id", required for DataGrid
            const updatedData: PortfolioData[] = response.data.map((row, index) => ({
              id: row.investment_id,
              ...row,
              performance:(( (row["Last Closing"]-row.average_price)/row.average_price)*100).toFixed(1) +"%"
            }));
            setData(response.data)
            
            // Set DataGrid columns and data
            setColumns(allColumns);
            setPortfolioData(updatedData);
          } else {
            // If API returns no data, clear table
            setColumns([]);  
            setPortfolioData([]);  
          }
        })
        .catch(error => {
          console.error("Error fetching portfolio data:", error);
          // Clear data in case of error
          setColumns([]);  
          setPortfolioData([]);  
        });

    } else {
      // Clear table when no portfolio is selected
      setColumns([]);  
      setPortfolioData([]);  
    }
  }, [selectedPortfolio]);

  // Handle row deletion
  const handleDelete = async () => {
    // Step 1: Retrieve the selected rows
    const rowsToDelete = portfolioData.filter((row) =>
      selectedRows.includes(row.id),
    );

    // Step 2: Call API to delete rows from the database
    try {
      const deletePromises = rowsToDelete.map(row =>
        axios.delete(`http://localhost:5000/portfolios/investments?investment_id=${row.investment_id}}`, {
          data: { ...row } // Pass the row data to delete
        }))

      // Step 3: Remove deleted rows from the DataGrid
      setPortfolioData((prevData) => prevData.filter((row) => !selectedRows.includes(row.id)));

      // Step 4: Clear the selected rows state
      setSelectedRows([]); // Clear selection after deleting
      }
      // You can display a success message if needed
    catch (error) {
      console.error("Error deleting rows:", error);
    } 
  };

  //handle the delete portfolio button
  const handleDeletePortfolio = async () => {

    if (selectedPortfolio !== "Select Portfolio"){

      setOpenDeletePortfolioPopup(true)

    }else {
      setDeleteAlertOpen(true); // otherwise display a warning that no portfolio has been selected
    }
    
    
  };


  //handle the click of add ticker button
  const handleAddTicker = () => {

    if (selectedPortfolio !== "Select Portfolio") { //if a portfolio has been selected
      setOpenTickerPopup(true); //open the popup to add the ticker info

    } else {
      setAlertOpen(true); // otherwise display a warning that no portfolio has been selected
    }
  };



  // EditToolbar component with delete button
  function EditToolbar() {
    return (

      <GridToolbarContainer>

        <MuiButton color="primary" onClick={handleAddTicker}  startIcon={<AddIcon />}> {/* Add ticker button */}
          Add ticker
        </MuiButton>

        {/* Show delete button only if rows are selected */}
        {selectedRows.length > 0 && (
          <IconButton color="error" onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        )}

          {/* popup to add investment information about the selected ticker */}
        <TickerPopup open={openTickerPopup} onClose={() => setOpenTickerPopup(false)} selectedPortfolio={selectedPortfolio} />

        {/* Alert if the user tries to add tickers without selecting a portfolio first */}
        <Snackbar
        open={alertOpen}
        autoHideDuration={3000}
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
        <Alert severity="warning" onClose={() => setAlertOpen(false)}>
          Please select or create a portfolio before adding a ticker!
        </Alert>
        </Snackbar>

      </GridToolbarContainer>
    );
  }

  
  //function to calculate the values for the allocation pie chart
  function transformDataForPieChart(data: PortfolioData[]): PieChartData[] {
    
    // Calculate total value of all items
    const total_value = data.reduce((sum, item) => sum + item.Amount, 0);
    
    // Group items by company_id and sum their values
    const groupedData = data.reduce((acc, item) => {
      // If the company_id already exists in the accumulator, sum the value
      if (acc[item.Company]) {
        acc[item.Company].value += (item.Amount / total_value) * 100;
      } else {
        // Otherwise, add a new entry with the current item
        acc[item.Company] = {
          id: item.Company,
          value: (item.Amount / total_value) * 100,
          label: item.Company,
        };
      }
      return acc;
    }, {});
   
    // Return the grouped data as an array
    return Object.values(groupedData).map((item) => ({
      id: item.id,
      value: Math.round(item.value * 100) / 100, // Round the value to 2 decimals
      label: item.label,
    }));
  }


  //fetch the latest closing price for all the tickers in the portfolio
  useEffect(() => {
    async function fetchClosingPrices(data: PortfolioData[]) {
      try {
        
        const companies = data.map(company => company.Company).join(',');
        
        const response = await axios.get(`http://localhost:5000/last-closing?companies=${companies}`);
        setClosingPrices(response.data); // Store the API response
        
      } catch (err) {
        console.log('Failed to fetch closing prices');
      } 
    }
    
    fetchClosingPrices(data); // Call the function inside useEffect
    
  }, [data]); // Runs when fetched_data changes

  //fetch the closing prices this month for the portfolio
  useEffect(() => {
    
    axios.get(`http://localhost:5000/closing/this-month?portfolio_name=${selectedPortfolio}`)
      .then((response) => {
        setThisMonthData(response.data); 
      })
      .catch((error) => {
        console.error("Error fetching portfolios:", error);
      });
  }, []);


  //calculating the portfolios performance
  function CalculatePerformance(data : PortfolioData[], prices: PortfolioData[]) {

    //if the api call returns closing prices for the selected companies
    if(prices){

      //calculating the total amount invested
      const totalInvested = data.reduce((sum, item) => sum + item.Amount, 0)

      //constructing an array of items like [ {company: "APPL",value: "1000"} ]
      //that represents the actual value of each investment by multiplying the quantity of stocks with the latest closing price
      const values = data.map(item => {

        const priceEntry = prices.find(price => price.Company===item.Company)
        const closingPrice = priceEntry ? priceEntry.closing_price : 0;
  
        return {
          company: item.Company,
          value: item.quantity * closingPrice
      };
      })
      
      //calculating the total value of the portfolio by summing the value of all the tickers
      const total_value=values.reduce((sum,item) => sum + item.value,0)
      const percentage_increase=( ((total_value-totalInvested) / totalInvested ) *100)

      //returning the performance as percenatge increase
      return{total_value,percentage_increase}
    } 
    
    else{
      
      const total_value=data.reduce((sum, item) => sum + item.Amount, 0)
      const percentage_increase=0

      return{total_value,percentage_increase}
    }
  }

  const {total_value,percentage_increase} =CalculatePerformance(data, closingPrices)
  
  //variables for the portfolio value animation
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latestValue) =>  Math.round(latestValue) )

  //use effect for the value animation
  useEffect(() => {
    const controls = animate(count, total_value, { duration: 3 })
    return () => controls.stop()
}, [total_value,portfolioData])


  console.log(thisMonthData)
  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>

        {/* Dropdown button to select portfolio */}
        <DropdownButton id="dropdown-basic-button" title={selectedPortfolio} className='select-portfolio-dropdown'>
          {portfolios.length > 0 ? (
            portfolios.map((portfolio, index) => (
              <Dropdown.Item key={index} onClick={() => setSelectedPortfolio(portfolio)}>{portfolio}</Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item disabled>Loading...</Dropdown.Item>
          )}
        </DropdownButton>
          
          {/* Button to create portfolio*/}
        <div className="d-flex gap-2">
          <BootstrapButton variant="contained" size="sm" style={{ color: "white" }} onClick={() => setOpenPortfolioPopup(true)} >
            <AddBoxOutlinedIcon sx={{ mr: 1 }} /> Create Portfolio
          </BootstrapButton>

          <BootstrapButton variant="contained" size="sm" style={{ color: "white" }} onClick={() => handleDeletePortfolio()} >
            <DeleteOutlinedIcon sx={{ mr: 1 }} /> Delete Portfolio
          </BootstrapButton>
          <Snackbar
          open={deleteAlertOpen}
          autoHideDuration={3000}
          onClose={() => setDeleteAlertOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Alert severity="warning" onClose={() => setDeleteAlertOpen(false)}>
              Please select or create a portfolio before deleting it!
            </Alert>
          </Snackbar>
          <Popup open={openPortfolioPopup} onClose={() => setOpenPortfolioPopup(false)} />
          <DeletePortfolioPopup open={openDeleteTickerPopup} onClose={() => setOpenDeletePortfolioPopup(false)} selectedPortfolio={selectedPortfolio} />
        </div>
          
        
      </Box>

          {/* MUI Datagrid component to display the investments of the selected portfolio */}
      <Box sx={{
        height: 400,
        width: '100%',
        backgroundColor: "#1F2A40",
        "& .MuiDataGrid-cell": { color: "white" }, // Set cell text color to white
        "& .MuiDataGrid-columnHeader": { backgroundColor: "#1F2A40" }, // Ensure each header cell is transparent
        "& .MuiDataGrid-columnHeaderTitle": { color: "white" }, // Make sure header text remains white
        "& .MuiDataGrid-overlay": { backgroundColor: "#1F2A40", color: "white" }, // Make empty state background transparent
        "& .MuiDataGrid-footerContainer": { backgroundColor: "#1F2A40" }, // Make pagination/footer transparent
        "& .MuiDataGrid-filler": { backgroundColor: "#1F2A40" }, // Transparent empty area
        [`.${gridClasses.cell}.profit`]: {
          color: '#5ce65c',
        },
        [`.${gridClasses.cell}.loss`]: {
          color: '#880808',
        },
      }}>

        <DataGrid
          rows={portfolioData}
          columns={columns}
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{ toolbar: EditToolbar }}
          onRowSelectionModelChange={(newSelectionModel) => setSelectedRows(newSelectionModel as number[])} 
          getCellClassName={(params: GridCellParams<any, any, number>) => {
            if (params.field === 'performance' ) {
              return (parseFloat(params.value.replace("%","")) >= 0 ? 'profit' : 'loss') ;
            }
            return ''
          }}
        />
      </Box>
      
      {selectedPortfolio!=="Select Portfolio" && (
          <div style={{ display: "flex", justifyContent:"space-between", flexWrap:'wrap' }}>
            

            <motion.div
              style={box}
              whileHover={{
                  scale: [null, 1.1, 1.2],
                  transition: {
                      duration: 0.5,
                      times: [0, 0.6, 1],
                      ease: ["easeInOut", "easeOut"],
                  },
              }}
              transition={{
                  duration: 0.3,
                  ease: "easeOut",
              }}
              >

              
              <div className='h1-bold'>Total Value </div>
              <div className='flex portfolio-value-number' >
                <span>$</span>
                <motion.pre >{rounded}</motion.pre>
                  
              </div>
              <div 
                className={percentage_increase > 0 ? 'text-green' : 'text-red'} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px' }}
              > 
                {percentage_increase.toFixed(2) + "%"}
                <div className='portfolio-value-box-text'>since inception</div>
              </div>
                
              
              

            </motion.div>


            <motion.div
              style={box}
              whileHover={{
                  scale: [null, 1.1, 1.2],
                  transition: {
                      duration: 0.5,
                      times: [0, 0.6, 1],
                      ease: ["easeInOut", "easeOut"],
                  },
              }}
              transition={{
                  duration: 0.3,
                  ease: "easeOut",
              }}
              >
                <div className='h1-bold' >Portfolio Allocation</div>
              
                <ResponsivePie
                  data={transformDataForPieChart(portfolioData)}  
                  margin={{ top: 70, right: 40, bottom: 90, left: 70 }}             
                  innerRadius={0.75}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'reds' }}
                  borderWidth={1}
                  borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                  enableArcLinkLabels={false}
                  legends={[
                    {
                        anchor: 'top-left',
                        direction: 'column',
                        justify: false,
                        itemsSpacing: 0,
                          
                        itemWidth: 100,
                        itemHeight: 20,
                        translateX:-90,
                        itemTextColor: '#999',
                        itemDirection: "right-to-left",
                        itemOpacity: 1,
                        symbolSize: 20,
                        symbolShape: 'square',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemTextColor: '#000'
                                }
                            }
                        ]
                    }
                ]}
                />
    
            
            </motion.div>
            

            <motion.div
            
            style={box}
            whileHover={{
                scale: [null, 1.1, 1.2],
                transition: {
                    duration: 0.5,
                    times: [0, 0.6, 1],
                    ease: ["easeInOut", "easeOut"],
                },
            }}
            transition={{
                duration: 0.3,
                ease: "easeOut",
            }}
            >

          
            </motion.div>
            

            <motion.div
            style={box}
            whileHover={{
                scale: [null, 1.1, 1.2],
                transition: {
                    duration: 0.5,
                    times: [0, 0.6, 1],
                    ease: ["easeInOut", "easeOut"],
                },
            }}
            transition={{
                duration: 0.3,
                ease: "easeOut",
            }}
            >

          
            </motion.div>

          </div>
      )}
    </div>
  );
} 



export default Portfolios;
