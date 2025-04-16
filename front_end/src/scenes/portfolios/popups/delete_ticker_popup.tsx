import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";


interface PopupProps {
  open: boolean;
  onClose: () => void; 
  portfolio: string 
  company: string | null
}

const DeleteTickerPopup: React.FC<PopupProps> = ({ open, onClose, portfolio, company }) => {
  
    const navigate = useNavigate();
    
    
  //post request to the API to add the new portfolio to the database
  const handleDeletePortfolio = async () => {
  

    try{
        const respone= await axios.delete(`http://localhost:5000/portfolios/investments/remove?portfolio_name=${portfolio}&company_id=${company}`)
        
        if (respone.status==200){
          onClose()
          navigate(`/portfolios?portfolio_name=${portfolio}`, { replace: true }); 
          window.location.reload();
        }
      }catch(error){
        console.log(error)
      }

        
    
  };

  //handlign the close of the popup
  const handleClose = () => {

    onClose(); // Close the dialog
  };


  return (
    
    <>
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Delete</DialogTitle>
            <DialogContent>
                <p>
                Are you sure you want to permanently delete {company} from {portfolio} portfolio?  <br></br>
                This Action is irreversible
                </p>
            </DialogContent>
            <DialogActions>
                    <Button onClick={handleDeletePortfolio} color="secondary">Yes</Button>
                    <Button onClick={handleClose} color="secondary">No</Button>
            </DialogActions>
        </Dialog>
        
        
    </>
    
  );
};

export default DeleteTickerPopup;
