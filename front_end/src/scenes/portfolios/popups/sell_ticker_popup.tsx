import React, { useState, useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import Alert from '@mui/material/Alert';
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
import Stack from '@mui/material/Stack';

interface PopupProps {
  open: boolean;
  onClose: () => void;
  company: string | null;
  portfolio: string | null;
  availableQuantity: number|null
}

interface investment { 
  company_id:string | null, 
  date: Dayjs | null, 
  amount_invested: string, 
  quantity: string, 
  average_price: string

}
const SellTickerPopup: React.FC<PopupProps> = ({ open, onClose, company, portfolio, availableQuantity }) => {
  
  
  const navigate = useNavigate(); // React Router navigation
  const [amount, setAmount] = useState(""); //state to save amount
  const [date, setDate] = useState<Dayjs | null>(dayjs()) //state to save selected date
  const [detailsList, setDetailsList] = useState<{company_id:string|null,quantity:string, date: string , amount_sold: string, quantity_sold: string; average_price_sold: string; }[]>([]); //list to store amount and date for an investment
  const [quantity, setQuantity]=useState("")
  const [avgPrice, setAvgPrice]=useState("")
  const [removeInvestment, setRemoveInvestment]= useState(false)
  const [quantityAlert,setQuantityAlert]= useState(false)

  //post request to the API to add the new portfolio to the database
  const handleSell = async () => {
        
        //if the amount sold equals to total of the available shares
        //delete completely the investment from the database
        if (removeInvestment==true){
          try{
            const respone= await axios.delete(`http://localhost:5000/portfolios/investments/remove?portfolio_name=${portfolio}&company_id=${company}`)
            
            if (respone.status==200){
              setRemoveInvestment(false)
              onClose()
              navigate(`/portfolios?portfolio_name=${portfolio}`, { replace: true }); 
              window.location.reload();
            }
          }catch(error){
            console.log(error)
          }

        }else if(detailsList){
          
          try{
            const post_response=await axios.post(
              `http://localhost:5000/portfolios/investments?portfolio_name=${portfolio}`, // endpoint
              { investments: detailsList} // Send investments array
            );
            
            if (post_response.status === 200){  //if the post was succesfull
                
              onClose(); //close the popup
              
              //navigate to the portfolio page and reload the page to fetch the newest data
              navigate(`/portfolios?portfolio_name=${portfolio}`, { replace: true }); 
              window.location.reload();
              
            }
          }catch(error){
            console.log(error)
        }

        }
      
      
    
  };

  //handlign the close of the popup
  const handleClose = () => {
    setAmount(""); // Clear input
    setAvgPrice("")
    setQuantity("")
    setDate(dayjs());
    setDetailsList([])
    onClose(); // Close the dialog
  };


  //calculate the total investment amount every time the amount or avgprice changes
    useEffect(() => {
      // Calculate amount only if quantity and avgPrice are valid numbers
      const calculatedAmount = -parseFloat(quantity) * parseFloat(avgPrice);
      setAmount(isNaN(calculatedAmount) ? "" : calculatedAmount.toString());
    }, [quantity, avgPrice]); // Run effect when quantity or avgPrice changes
      
     
  const handleAddDetail= () =>{
    if(availableQuantity && Number(quantity)>availableQuantity ){
      
        setQuantityAlert(true)
        setTimeout(() => {
          setQuantityAlert(false);
        }, 3000);
      
      
    }else if (quantity.trim() && avgPrice.trim() && date) {
      if(Number(quantity)==availableQuantity){
        setRemoveInvestment(true)
      }
          
      setDetailsList([...detailsList, {company_id:company,quantity: (-Number(quantity)).toString() ,quantity_sold: quantity, average_price_sold:avgPrice, amount_sold:amount, date: date.format("YYYY-MM-DD"), }]) // Add to list
      setAmount(""); // Clear input
      setAvgPrice("")
      setQuantity("")
      setDate(dayjs());
          
        }
  }
  

  return (
    
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {quantityAlert &&(
        <Alert variant="outlined" severity="error"  onClose={() => setQuantityAlert(false)}>
            Insert a valid quantity.You are trying to sell more than the available stocks.
        </Alert>)}
      <DialogTitle>Enter Sell Details </DialogTitle>
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
          <InputLabel htmlFor="filled-adornment-amount">Selling Price</InputLabel>
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
      </DialogContent>
            
      <DialogActions>
        <Button onClick={handleSell} color="primary">Sell</Button>
        <Button onClick={handleClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SellTickerPopup;
