import React, { useState,useEffect } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box } from "@mui/material";
import Textarea from '@mui/joy/Textarea';
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";


interface PopupProps {
  open: boolean;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ open, onClose }) => {
  
  const [newPortfolio,setNewPortfolio]= useState<string>("");
  const navigate = useNavigate(); // React Router navigation

  //post request to the API to add the new portfolio to the database
  const handleCreate = async () => {
    if (newPortfolio.trim() !== "") {
      try {
        await axios.post("http://localhost:5000/portfolios", {
          portfolio_name: newPortfolio.trim(), 
          date_created: new Date().toISOString().split("T")[0],
        });

        setNewPortfolio(""); // Clear input after submission
        onClose(); // Close the dialog
        navigate(`/`, { replace: true });//navigate to the new portfolio page 
        window.location.reload(); //reload the page
      } catch (error) {
        console.error("Error creating portfolio:", error);
      }
    }
  };

  //handlign the close of the popup
  const handleClose = () => {
    setNewPortfolio(""); // Reset the input when closing the dialog
    onClose(); // Close the dialog
  };


  return (
    
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create a new Portfolio</DialogTitle>

      <DialogContent>
        
        <Textarea name="Outlined" placeholder="Portfolio Name" variant="outlined" value={newPortfolio}
          onChange={(e) => setNewPortfolio(e.target.value)} />
        
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreate} color="secondary">Create</Button>
        <Button onClick={handleClose} color="secondary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default Popup;
