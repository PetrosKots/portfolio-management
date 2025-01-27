import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp, GridRowModesModel, GridRowModes, GridToolbarContainer } from '@mui/x-data-grid';
import { Button as BootstrapButton } from 'react-bootstrap';
import { Button as MuiButton } from '@mui/material';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import AddIcon from '@mui/icons-material/Add';
import Popup from "./create_portfolio_popup";
import TickerPopup from './add_ticker_popup';
import DeletePortfolioPopup from './delete_portfolio_popup';
import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {Alert, Snackbar} from '@mui/material';

// Define PortfolioData type to be flexible
interface PortfolioData {
  [key: string]: any;
}

const Portfolios = () => {
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

            // Ensure each row has an "id", required for DataGrid
            const updatedData: PortfolioData[] = response.data.map((row, index) => ({
              id: row.investment_id,
              ...row
            }));

            // Set DataGrid columns and data
            setColumns(newColumns);
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
        axios.delete(`http://localhost:5000/portfolios/investments?investment_id=${row.id}`, {
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

  
  return (
    <div>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>

        {/* Dropdown button to select portfolio */}
        <DropdownButton id="dropdown-basic-button" title={selectedPortfolio}>
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
        backgroundColor: "transparent",
        "& .MuiDataGrid-cell": { color: "white" }, // Set cell text color to white
        "& .MuiDataGrid-columnHeader": { backgroundColor: "#141b2d" }, // Ensure each header cell is transparent
        "& .MuiDataGrid-columnHeaderTitle": { color: "white" }, // Make sure header text remains white
        "& .MuiDataGrid-overlay": { backgroundColor: "transparent", color: "white" }, // Make empty state background transparent
        "& .MuiDataGrid-footerContainer": { backgroundColor: "transparent" }, // Make pagination/footer transparent
        "& .MuiDataGrid-filler": { backgroundColor: "#141b2d" } // Transparent empty area
      }}>

        <DataGrid
          rows={portfolioData}
          columns={columns}
          pageSizeOptions={[5]}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{ toolbar: EditToolbar }}
          onRowSelectionModelChange={(newSelectionModel) => setSelectedRows(newSelectionModel as number[])} // Ensure selection model is typed correctly
        />
      </Box>

    </div>
  );
}

export default Portfolios;
