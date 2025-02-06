import React, { useState,useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from "@mui/material";
import Textarea from '@mui/joy/Textarea';
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import {Alert, Snackbar} from '@mui/material';

interface PopupProps {
  open: boolean;
  onClose: () => void; 
  selectedPortfolio: string;
  
}

const DeletePortfolioPopup: React.FC<PopupProps> = ({ open, onClose, selectedPortfolio }) => {
  
    const navigate = useNavigate();
    
    
  //post request to the API to add the new portfolio to the database
  const handleDeletePortfolio = async () => {
  

    try {

        //call API to delete the portfolio
        const response= await axios.delete(`http://localhost:5000/portfolios?portfolio_name=${selectedPortfolio}`)
    
        if (response.status==200) {
            handleClose()
            navigate(`/portfolios?portfolio_name=${selectedPortfolio}`, { replace: true });
            window.location.reload();
        }
    }
    // You can display a success message if needed
    catch (error) {
    console.error("Error deleting rows:", error);
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
                Are you sure you want to permanently delete {selectedPortfolio} <br></br>
                This Action is irreversible
                </p>
            </DialogContent>
            <DialogActions>
                    <Button onClick={handleDeletePortfolio} color="secondary">Yes</Button>
                    <Button onClick={handleClose} color="secondary">No</Button>
            </DialogActions>
        </Dialog>
        {/* Alert if the user tries to add tickers without selecting a portfolio first */}
        
    </>
    
  );
};

export default DeletePortfolioPopup;
