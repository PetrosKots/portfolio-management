import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { groupBy, values } from 'lodash';
import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef, gridClasses, GridToolbarContainer, GridCellParams } from '@mui/x-data-grid';
import { Button as BootstrapButton } from 'react-bootstrap';
import { Button as MuiButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TickerPopup from './popups/add_ticker_popup';
import DeletePortfolioPopup from './popups/delete_portfolio_popup';
import SellTickerPopup from './popups/sell_ticker_popup';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { IconButton } from "@mui/material";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { ResponsivePie } from '@nivo/pie'
import { TrendingUp } from "lucide-react"
import * as motion from "motion/react-client"
import DeleteTickerPopup from './popups/delete_ticker_popup';
import { animate, useMotionValue, useTransform } from "motion/react"
import  "../../globals.css"
import { CartesianGrid, Line, LineChart, XAxis,YAxis } from "recharts"
import {ChartConfig,ChartContainer,ChartTooltip,ChartTooltipContent,} from "@/components/ui/chart"
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

// Define PortfolioData type to be flexible
interface PortfolioData {
  [key: string]: any;
}

type PieChartData = {
  id: string;
  value: number;
  label : string
};

interface LastOpenClose {
  company_id: string,
  quantity: number,
  open_price:number,
  closing_price: number
}
const Portfolios = () => {
  const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "hsl(var(--chart-1))",
    },
    mobile: {
      label: "Mobile",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig


  //style of the animation box
  const box = {
    marginTop:"5%",
    width: 500,
    height: 500,
    backgroundColor: "#1F2A40",
    borderRadius: 5,
  }
  
  const [searchParams] = useSearchParams(); // Get URL search parameters
  const selectedPortfolio = searchParams.get("portfolio_name"); // Selected portfolio
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]); // Data for DataGrid
  const [columns, setColumns] = useState<GridColDef[]>([]); // Dynamic columns for DataGrid
  const [openTickerPopup, setOpenTickerPopup] = useState(false); // State for Ticker Popup
  const [openDeletePortfolioPopup, setOpenDeletePortfolioPopup] = useState(false); // State for Ticker Popup
  const [openDeleteTickerPopup, setOpenDeleteTickerPopup]= useState(false) //state for delete ticker popup
  const [data,setData]=useState<PortfolioData[]>([])
  const [closingPrices, setClosingPrices] = useState<any>(null); // state for the last closing prices returned by the api
  const [thisMonthData, setThisMonthData] = useState<any>(null);  //state for the last month data returned by the api
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); //HTML element used to capture the location of the click
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null); //id of the row that the editrow was clicked
  const [openSellPopup, setSellPopup] = useState(false)
  const [availableQuantity, setAvailableQuantity]= useState(0)
  const [lastOpenClose,setLastOpenClose]= useState<LastOpenClose[]>([])

  //fetching the portfolio data and creating the datagrid columns 
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
            .filter((key) => key !== "investment_id" && key!== "Last_Closing_USD") // Exclude the ID column
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
              },
              {
                field: "market_value", 
                headerName: "MARKET VALUE", 
                width: 150, 
                editable: false
            }
            ]
            
            // concatenating the columns returned from the API call and the custom created columns
            const allColumns = [...newColumns, ...extraColumns];
            
            // Ensure each row has an "id", required for DataGrid
            const updatedData: PortfolioData[] = response.data.map((row, index) => ({
              id: row.investment_id,
              ...row,
              performance:(( (row[`Last_Closing`]-row.average_price)/row.average_price)*100).toFixed(1) +"%",
              market_value:(row[`Last_Closing`]*row.quantity)
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
        .catch(()=> {
          
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

  //function to handle the click of the edit row button
  const handleEditRowClick = (event: React.MouseEvent<HTMLButtonElement>, company: string, quantity:number) => {
    
    setAnchorEl(event.currentTarget);
    setSelectedCompany(company);
    setAvailableQuantity(quantity)
  };

  //function to close the editrow button
  const handleEditRowClose = () => {
    setAnchorEl(null);
    setSelectedCompany(null);
  };

  const handleSellRowClick = () => {
    setSellPopup(true)
    setAnchorEl(null);
    
  }

  const handleDeleteRowClick = () => {
    setOpenDeleteTickerPopup(true)
    setAnchorEl(null);
    
  }

  // Function to render a button that is positioned as first column of the datagrid and will allow editing of the row
  const EditRowButton = (params: any) => (
    <>
      <IconButton onClick={(event) => handleEditRowClick(event, params.row.Company, params.row.quantity)} size="small">
        <MoreHorizIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && selectedCompany === params.row.Company}
        onClose={handleEditRowClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem onClick={handleSellRowClick}>Sell</MenuItem>
        <MenuItem onClick={handleDeleteRowClick}>Delete</MenuItem>
      </Menu>
    </>
  );

  

  //handle the delete portfolio button
  const handleDeletePortfolio = async () => {

    if (selectedPortfolio){

      setOpenDeletePortfolioPopup(true)

    }
     
  };


  //handle the click of add ticker button
  const handleAddTicker = () => {

    if (selectedPortfolio) { //if a portfolio has been selected
      setOpenTickerPopup(true); //open the popup to add the ticker info

    }
  };



  // EditToolbar component with delete button
  function EditToolbar() {
    return (

      <GridToolbarContainer>

        <MuiButton color="primary" onClick={handleAddTicker}  startIcon={<AddIcon />}> {/* Add ticker button */}
          Add ticker
        </MuiButton>

        

          {/* popup to add investment information about the selected ticker */}
        <TickerPopup open={openTickerPopup} onClose={() => setOpenTickerPopup(false)} selectedPortfolio={selectedPortfolio} />

      </GridToolbarContainer>
    );
  }

  
  //function to calculate the values for the allocation pie chart
  function transformDataForPieChart(data: PortfolioData[]): PieChartData[] {
    
    // Calculate total value of all items
    const total_value = data.reduce((sum, item) => sum + item.Amount_Invested, 0);
    
    // Group items by company_id and sum their values
    const groupedData = data.reduce((acc, item) => {
      // If the company_id already exists in the accumulator, sum the value
      if (acc[item.Company]) {
        acc[item.Company].value += (item.Amount_Invested / total_value) * 100;
      } else {
        // Otherwise, add a new entry with the current item
        acc[item.Company] = {
          id: item.Company,
          value: (item.Amount_Invested / total_value) * 100,
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
    if(selectedPortfolio){
      axios.get(`http://localhost:5000/closing/this-month?portfolio_name=${selectedPortfolio}`)
      .then((response) => {
        setThisMonthData(response.data); 
      })
      .catch((error) => {
        console.error("Error fetching portfolios:", error);
      });
  }

    }
    , [portfolioData]);

  
    //hook to fetch todays opening and last known price 
  useEffect(() => {
    if(selectedPortfolio){
      axios.get(`http://localhost:5000/portfolios/opening-and-last?portfolio_name=${selectedPortfolio}`)
      .then((response) => {
        setLastOpenClose(response.data); 
      })
      .catch((error) => {
        console.error("Error fetching portfolios:", error);
      });
    }

    }
    , [portfolioData]);

  
  //calculating the portfolios performance
  function CalculatePerformance(data : PortfolioData[], prices: PortfolioData[]) {

    //if the api call returns closing prices for the selected companies
    if(prices){

      //calculating the total amount invested
      const totalInvested = data.reduce((sum, item) => sum + item.Amount_Invested, 0)

      //constructing an array of items like [ {company: "APPL",value: "1000"} ]
      //that represents the actual value of each investment by multiplying the quantity of stocks with the latest closing price
      const values = data.map(item => {

        const priceEntry = prices.find(price => price.Company===item.Company)
        const closingPrice = priceEntry ? priceEntry.Last_Closing_USD : 0;
  
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
      
      const total_value=data.reduce((sum, item) => sum + item.Amount_Invested, 0)
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
   

  function transformDataForLineChart(data: PortfolioData[]) {
      //using that groupedByDate, the line chart displays only the days that have data for all
      // the tickers.The problem is that for days that the american stock market is closed for holidays
      //but the European is open, the api returns data only for the european tickers, so the total value
      //is wrong as it only calculates the returned values
      //could either completely remove european stock or find another way to prevent it
      const groupedByDate=Object.fromEntries( Object.entries(groupBy(data,'date')).filter( ([date, companies]) => companies.length==portfolioData.length ) )
      
      
      
      const portfolioValueEachDay = Object.entries(groupedByDate).map(([date, group]) => {

        // Perform calculations within each date group
        const totalValue = group.reduce((sum, entry) => sum + (entry.quantity*entry.closing_price), 0);
        
        return { date, totalValue }; // Return an object with date and totalValue
    });
      return portfolioValueEachDay
  }

 function CalculateTodaysPnL(data: LastOpenClose[]){
  const PnL= data.reduce((sum,company) => {
    
    return sum + Object.values(company).reduce(()  =>(company.quantity*company.closing_price) - (company.quantity*company.open_price))
  },0)

  return PnL
 }
  
 
 function CalculateTodaysPerformance(data: LastOpenClose[]) {
    const ValuAtOpen= data.reduce((sum,company) => {
      return sum + Object.values(company).reduce(()  => (company.quantity*company.open_price))
    },0)
    
    const LatestValue = data.reduce((sum,company) => {
      return sum + Object.values(company).reduce(()  => (company.quantity*company.closing_price))
    },0)
    
    return (Number(LatestValue)-Number(ValuAtOpen))/Number(ValuAtOpen)
 }  
  
  return (
    
    <div>
      {selectedPortfolio && (
       <div>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <div className="d-flex gap-2">
          
          <BootstrapButton variant="contained" size="sm" style={{ color: "white" }} onClick={() => handleDeletePortfolio()} >
            <DeleteOutlinedIcon sx={{ mr: 1 }} /> Delete Portfolio
          </BootstrapButton>
          
          <DeleteTickerPopup open={openDeleteTickerPopup} onClose={() => setOpenDeleteTickerPopup(false)} portfolio={selectedPortfolio} company={selectedCompany}/>
          <DeletePortfolioPopup open={openDeletePortfolioPopup} onClose={() => setOpenDeletePortfolioPopup(false)} selectedPortfolio={selectedPortfolio} />
          <SellTickerPopup open={openSellPopup} onClose={() => setSellPopup(false)} company={selectedCompany} portfolio={selectedPortfolio} availableQuantity={availableQuantity}/>
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
          columns={
            [
              {
                field: "actions",
                headerName: "Actions",
                width: 100,
                sortable: false,
                renderCell: EditRowButton, // This should be a function returning JSX
              },
              ...columns, // Spread the existing columns dynamically
            ]
          }
          pageSizeOptions={[10]}
                
          disableRowSelectionOnClick
          slots={{ toolbar: EditToolbar }}
          getCellClassName={(params: GridCellParams<any, any, number>) => {
            if (params.field === 'performance' ) {
              return (parseFloat(params.value.replace("%","")) >= 0 ? 'profit' : 'loss') ;
            }
            return ''
          }}
        />
      </Box>
      
      {portfolioData.length>0 && (
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
                {percentage_increase.toFixed(2) + "%"}<TrendingUp className="h-4 w-4" />
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
              <div className='h1-bold' >Portfolio Value This Month</div>
            <ChartContainer config={chartConfig} style={{ width: "100%", maxWidth: "100%" }}>
              <LineChart
                accessibilityLayer
                data={transformDataForLineChart(thisMonthData)}
                margin={{
                  left: 20,
                  right: 12,
                  top: 60
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  
                  tick={true}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(5, 10)}
                />
                <YAxis 
                  dataKey="totalValue" 
                  axisLine={false} 
                  tickLine={false} 
                  domain={['dataMin', 'auto']} 
                />

                <ChartTooltip
                  cursor={true}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Line
                  dataKey="totalValue"
                  type="natural"
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                  dot={{
                    fill: "var(--color-desktop)",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ChartContainer>

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
            <div className='h1-bold' >Daily P&L</div>
            <div className='flex portfolio-value-number' >
                <span>$</span>
                <motion.pre >{CalculateTodaysPnL(lastOpenClose).toFixed(2)}</motion.pre>
                  
              </div>
              <div 
                className={CalculateTodaysPerformance(lastOpenClose) > 0 ? 'text-green' : 'text-red'} 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '10px' }}
              > 
                {(CalculateTodaysPerformance(lastOpenClose)*100).toFixed(2) + "%"}<TrendingUp className="h-4 w-4" />
                <div className='portfolio-value-box-text'>since inception</div>
              </div>
            </motion.div>

          </div>
      )}

       </div>
      )}
    </div>
  );
} 



export default Portfolios;
