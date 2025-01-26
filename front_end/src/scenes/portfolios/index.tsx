import React from 'react'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import 'bootstrap/dist/css/bootstrap.min.css'
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import{Box} from '@mui/material'
import {DataGrid, GridColDef, GridToolbarContainer,GridRowsProp,GridRowModesModel,GridRowModes} from '@mui/x-data-grid'
import { Button as BootstrapButton } from 'react-bootstrap';
import { Button as MuiButton } from '@mui/material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import AddIcon from '@mui/icons-material/Add';
import Popup from "./create_portfolio_popup"
import TickerPopup from './add_ticker_popup';
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    setRows: (newRows: (oldRows: GridRowsProp) => GridRowsProp) => void;
    setRowModesModel: (
      newModel: (oldModel: GridRowModesModel) => GridRowModesModel,
    ) => void;
  }
} 

const Portfolios = () => {
  interface PortfolioData {
    [key: string]: any; // Allows flexible structure while ensuring type safety
  }

  const [searchParams] = useSearchParams(); // Get URL search parameters
  const initialPortfolio = searchParams.get("portfolio_name") || "Select Portfolio"; // Get the portfolio name from URL
                                                                                    //If there is not a portfolio name keep the initial value
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(initialPortfolio); // Selected portfolio
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([]); // Data for DataGrid
  const [columns, setColumns] = useState<GridColDef[]>([]) // Dynamic columns for DataGrid
  const [openPortfolioPopup, setOpenPortfolioPopup] = useState(false); // State to control popup
  const [openTickerPopup, setOpenTickerPopup] = useState(false);

  

  useEffect(() => {
    axios.get("http://localhost:5000/portfolios")
      .then((response) => {
        setPortfolios(response.data); // Assuming response.data is an array of portfolio names
      })
      .catch((error) => {
        console.error("Error fetching portfolios:", error);
      });
  }, []);

  //get request for the api endpoint '/portfolio?portfolio_name=...' which returns the companies and company's data 
  // for all the companies in the selected portfolio
  //the api returns a dictionary like {'company': 'APPLE', 'amount_invested':500 ...}
  useEffect(() => {
    //if the user has selected a portfolio to view
    if (selectedPortfolio) {
      //get the portfolio data from an API call
      axios.get<PortfolioData[]>(`http://localhost:5000/portfolios?portfolio_name=${selectedPortfolio}`)

        .then(response => {
          if (response.data.length > 0) {
            const firstRow = response.data[0];
            
            // Dynamically creating new columns for the data grid table based on
            // the number of columns returned by the API response
            //firstRow is the column names of the response
            const newColumns: GridColDef[] = Object.keys(firstRow).map((key) => ({
              field: key,
              headerName: key.replace(/_/g, " ").toUpperCase(),
              width: 150,
              editable: false
            }));
  
            //Ensure each row has an "id",required for Datagrid
            const updatedData: PortfolioData[] = response.data.map((row, index) => ({
              id: index + 1,
              ...row
            }));
            //set Datagrids columns and data
            setColumns(newColumns);
            setPortfolioData(updatedData);

          } else {
            //  If API returns no data, clear table
            setColumns([]);  
            setPortfolioData([]);  
          }
        })
        //in case of an error
        .catch(error => {
          console.error("Error fetching portfolio data:", error);
          // Clear data in case of error
          setColumns([]);  
          setPortfolioData([]);  
        });

    } else {
      //Clear table when no portfolio is selected
      setColumns([]);  
      setPortfolioData([]);  
    }
  }, [selectedPortfolio]);

  

  function EditToolbar() {

    return (
      <GridToolbarContainer>
        <MuiButton color="primary"  onClick={() => setOpenTickerPopup(true)} startIcon={<AddIcon />}>
          Add ticker
        </MuiButton>

        <TickerPopup open={openTickerPopup} onClose={() => setOpenTickerPopup(false)} selectedPortfolio={selectedPortfolio}/>
      </GridToolbarContainer>
      
    );
  }




  return (
    
    <div>
      
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>

        <DropdownButton id="dropdown-basic-button" title={selectedPortfolio}>

          {portfolios.length > 0 ? (
            portfolios.map((portfolio, index) => (
              <Dropdown.Item key={index} onClick={() => setSelectedPortfolio(portfolio)}>{portfolio}</Dropdown.Item>
            ))
          ) : (
            <Dropdown.Item disabled>Loading...</Dropdown.Item>
          )}

        </DropdownButton>
        
        <div className="d-flex gap-2">
        <BootstrapButton  variant="contained" size="sm" onClick={() => setOpenPortfolioPopup(true)} >
          <AddBoxOutlinedIcon sx={{ mr: 1 }} />Create Portfolio
        </BootstrapButton>
        <Popup open={openPortfolioPopup} onClose={() => setOpenPortfolioPopup(false)} />

        </div>
      </Box>
      
      
      
      <Box sx={{ 
        height: 400, 
        width: '100%', 
        backgroundColor: "transparent",
        "& .MuiDataGrid-cell": {
              color: "white", // Set cell text color to white
            },
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "#141b2d", // Ensure each header cell is transparent
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              color: "white", // Make sure header text remains white
            },
            "& .MuiDataGrid-overlay": {
              backgroundColor: "transparent", // Make empty state background transparent
              color: "white", // Change "No rows" text to white
            },
            
            "& .MuiDataGrid-footerContainer": {
              backgroundColor: "transparent", // Make pagination/footer transparent
            },
            "& .MuiDataGrid-filler": {
              backgroundColor: "#141b2d", // Transparent empty area
            }
        }}>
        

        <DataGrid
          rows={portfolioData}
          columns={columns}
          editMode='row'
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick          
          slots={{ toolbar: EditToolbar }}
          
        />

      </Box>
      
    </div>
  )
}

export default Portfolios