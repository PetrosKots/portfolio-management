import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import tickerData from "../tickers/tickers.json";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from "dayjs";
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FilledInput from '@mui/material/FilledInput';
import{Box} from '@mui/material'
import axios from "axios";
import { useNavigate } from "react-router-dom";


interface PopupProps {
  open: boolean;
  selectedPortfolio: string;
  onClose: () => void;
}

interface TickerData {
  ticker: string;
  "company_name": string;
}

const TickerPopup: React.FC<PopupProps> = ({ open, onClose, selectedPortfolio }) => {

  const navigate = useNavigate(); // React Router navigation
  const [selectedTickers, setSelectedTickers] = useState<TickerData[]>([]); // Store multiple selected tickers
  const [inputValue, setInputValue] = useState(""); // Track the input value
  const [selectedValue, setSelectedValue] = useState<TickerData | null>(null); // Prevents display of last selected value
  const [openDetails, setOpenDetails] = useState(false);
  const [currentTicker, setCurrentTicker] = useState<TickerData | null>(null);
  const [investmentDict, setInvestmentDict] = useState<{ [key: string]: { quantity: string; avgPrice: string; amount: string; date: string }[] }>({}); //dict to hold investments for each ticker
  
  // Handle selection
  const handleSelect = (event: any, newValue: TickerData | null) => {
  
    if (newValue) { 

      //do nothing if the user selectes a ticker that is already selected
      //to avoid selection of same tickers
      if (selectedTickers.some((ticker) => ticker.ticker === newValue.ticker)) {
        setInputValue("");
        return; 
      }
      setSelectedTickers([...selectedTickers, newValue]); // Add to list
      setSelectedValue(null); // Reset selected value
      setCurrentTicker(newValue); // Store the selected ticker
      setOpenDetails(true); // Open the details dialog

    }
  };

  // Clear input after selection
  useEffect(() => {
    setInputValue(""); // Ensure input resets after selection
  }, [selectedTickers]);

  // Handle delete button that removes the ticker from the list
  const handleDelete = (index: number) => {
    setSelectedTickers(selectedTickers.filter((_, i) => i !== index));
  };

  //handling the insertion of new investments for a ticker 
  const handleCompleteDetails = (ticker: TickerData | null, newInvestments: { quantity: string; avgPrice: string; amount: string; date: string }[]) => {
    if (ticker) {
      // Update the investment dictionary for the specific ticker
      setInvestmentDict((prevDict) => {
        const updatedDict = { ...prevDict, [ticker.ticker]: newInvestments };
        return updatedDict;
      });
    }
  };

  //handle add button
  const handleAdd = async () => {
    
    if (investmentDict) {
      
  
      try {
        const investmentsToAdd = []; //array to store the investments that have been added to the portfolio
        const companies = [] //array to store the companies that have been to the portfolio
        const dates= [] //array to store the dates of the investments made
        const average_prices= []
        const quantities= []
        
        // Iterate through the investmentDict to extract ticker and details
        for (const [ticker, investments] of Object.entries(investmentDict)) {

          
          for (const investment of investments) {
            // Destructure the current investment and set company_id as ticker
            const { date, amount, quantity, avgPrice } = investment;

            companies.push(ticker)
            dates.push(date)
            average_prices.push(avgPrice)
            quantities.push(quantity)

            // Prepare the investment data to be sent
            investmentsToAdd.push({
              company_id: ticker,  // Use ticker as company_id
              date,
              amount_invested: amount,  // Assuming 'amount' is already a string
              average_price: avgPrice,
              quantity: quantity
            });
          }
        }
  
        //send API request to run the script that will fetch the historical data for the selected investments and selected dates
        axios.post(`http://localhost:5000/run-python`, {companies:companies,dates:dates})
        
        // Send the entire array of investments to the API
        const post_response=await axios.post(
          `http://localhost:5000/portfolios/investments?portfolio_name=${selectedPortfolio}`, // endpoint
          { investments: investmentsToAdd } // Send investments array
        );
        
        if (post_response.status === 200){  //if the post was succesfull
            
          onClose(); //close the popup
          
          //navigate to the portfolio page and reload the page to fetch the newest data
          navigate(`/portfolios?portfolio_name=${selectedPortfolio}`, { replace: true }); 
          window.location.reload();
          
        }
        
      } catch (error) {
        console.error("Error Adding Investments:", error);
      }
    }
  };
  
  

  return (
    <>
    
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">

      <DialogTitle>Add Tickers to the Portfolio</DialogTitle>

      <DialogContent>
        <Autocomplete //dropdown component to select a ticker from a list of all the tickers
          options={tickerData}
          getOptionLabel={(option) => `${option.ticker} - ${option["company_name"]}`}
          renderInput={(params) => <TextField {...params} label="Search Ticker or Company" />}
          onChange={handleSelect}
          inputValue={inputValue} // Controls the input text
          onInputChange={(event, newInputValue) => setInputValue(newInputValue)} // Updates input text
          value={selectedValue} // Ensures no old values are shown
        />
        <List>  
          {selectedTickers.map((ticker, index) => (  //list that displays all the selected tickers
            <ListItem key={index}
              sx={{
                border: "1px solid #ccc", // Light gray border
                borderRadius: "8px", // Optional: rounded corners
                marginBottom: "8px", // Space between items
                padding: "10px 20px" // Padding inside the item
              }}
              secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(index)}>  
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemText primary={`${ticker.ticker} - ${ticker["company_name"]}`} />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleAdd} color="secondary">Add</Button>
        <Button onClick={onClose} color="secondary">Close</Button>
      </DialogActions>
    </Dialog>

    <DetailsDialog 
        open={openDetails} 
        onClose={() => setOpenDetails(false)} 
        ticker={currentTicker} 
        investmentDict={investmentDict}
        onComplete={handleCompleteDetails}
      />
   </> 
  );
};

//investment details popup

interface DetailsDialogProps {
  open: boolean;
  onClose: () => void;
  ticker: TickerData | null;
  investmentDict: { [key: string]: { quantity:string; avgPrice:string; amount: string; date: string }[] };  // Add this line
  onComplete: (ticker: TickerData | null, newInvestments: { quantity:string; avgPrice:string; amount: string; date: string }[]) => void;  // Add this line

}

const DetailsDialog: React.FC<DetailsDialogProps> = ({ open, onClose, ticker, investmentDict, onComplete }) => {

  const [amount, setAmount] = useState(""); //state to save amount
  const [date, setDate] = useState<Dayjs | null>(dayjs()) //state to save selected date
  const [detailsList, setDetailsList] = useState<{ quantity: string; avgPrice: string; amount: string; date: string }[]>([]); //list to store amount and date for an investment
  const [quantity, setQuantity]=useState("")
  const [avgPrice, setAvgPrice]=useState("")

  // Handle submitting a new detail
  const handleAddDetail = () => {

    if (quantity.trim() && avgPrice.trim() && date) {
      
      
      setDetailsList([...detailsList, { quantity, avgPrice, amount, date: date.format("YYYY-MM-DD") }]);; // Add to list
      setAmount(""); // Clear input
      setAvgPrice("")
      setQuantity("")
      setDate(dayjs());
      
    }
  };

  // Handle deleting a detail
  const handleDeleteDetail = (indexToDelete: number) => {
    setDetailsList((prevList) => prevList.filter((_, index) => index !== indexToDelete));
  };

  // Handle when the user clicks 'Complete'
  const handleComplete = () => {
    if (ticker) {
      // Update the dictionary with the new investments
      onComplete(ticker, detailsList);
    }
    setDetailsList([]);  // Clear details after completing
    onClose();  // Close the dialog
    
  };

  // Reset the state when the popup closes
  useEffect(() => {
    if (!open) {
      setAmount("");
      setAvgPrice("")
      setQuantity("")
      setDate(dayjs());
      setDetailsList([]);  // Clears the list when popup closes
    }
  }, [open]); // Runs whenever `open` changes

  
  //calculate the total investment amount every time the amount or avgprice changes
  useEffect(() => {
    // Calculate amount only if quantity and avgPrice are valid numbers
    const calculatedAmount = parseFloat(quantity) * parseFloat(avgPrice);
    setAmount(isNaN(calculatedAmount) ? "" : calculatedAmount.toString());
  }, [quantity, avgPrice]); // Run effect when quantity or avgPrice changes


  return (
    
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">

      <DialogTitle>Enter Investment Details for {ticker?.ticker}</DialogTitle>
      <DialogContent sx={{ height: "400px", overflowY: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
        {/* Text Input for Extra Info */}
        <FormControl fullWidth sx={{ m: 1 }} variant="filled">
          <InputLabel htmlFor="filled-adornment-amount">Quantity</InputLabel>
          <FilledInput
            id="filled-adornment-quantity"
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
          />
        </FormControl>
        <FormControl fullWidth sx={{ m: 1 }} variant="filled">
          <InputLabel htmlFor="filled-adornment-amount">Average Price</InputLabel>
          <FilledInput
            id="filled-adornment-avgprice"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            value={avgPrice} 
            onChange={(e) => setAvgPrice(e.target.value)} 
          />
        </FormControl>
        <FormControl fullWidth sx={{ m: 1 }} variant="filled" disabled >
          <InputLabel htmlFor="filled-adornment-amount">Amount</InputLabel>
          <FilledInput
            id="filled-adornment-amount"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            value={amount}
            
          />
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker 
          label="Select Investment Date"  
          value={date}
          onChange={(newDate) => setDate(newDate)}                    
        />
        </LocalizationProvider>
      
        

        {/* Add Detail Button */}
        <Button 
          onClick={handleAddDetail} 
          color="primary" 
          variant="contained" 
          sx={{ marginTop: "10px", marginBottom: "10px" }}
        >
          Add Investment
        </Button>
        </Box>
        {/* List of Submitted Details */}
        <List>
          {detailsList.map((detail, index) => (
            <ListItem 
              key={index} 
              sx={{ border: "1px solid #ccc", borderRadius: "8px", marginBottom: "8px", padding: "10px 20px" }}
            >
              <ListItemText primary={`$${detail.amount} on ${detail.date}`}  />
              <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteDetail(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
            
      <DialogActions>
        <Button onClick={handleComplete} color="primary">Complete</Button>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
    
  );
};
export default TickerPopup;
