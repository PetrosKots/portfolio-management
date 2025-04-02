import React, { useState, useEffect } from 'react';
import Popup from './create_portfolio_popup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Sidebar, Menu, MenuItem, sidebarClasses, SubMenu } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import { Box, IconButton, Typography } from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AddIcon from '@mui/icons-material/Add';
import axios from "axios";

const HomeSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [openPortfolioPopup, setOpenPortfolioPopup] = useState(false);
  const [portfolios, setPortfolios]= useState([])
  const colors = {
    primary: '#1F2A40',
    secondary: '#e0e0e0',
    neutralDark:  '#3d3d3d',
    neutralLight: '#e0e0e0',
    neutralMain: '#666666',
  };

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
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        collapsed={isCollapsed}
        rootStyles={{
          [`.${sidebarClasses.container}`]: {
            backgroundColor: colors.primary, // Use the primary color from the theme
            height: '100%', // Full height
            minWidth: isCollapsed ? '80px' : 'auto', // Dynamic width
            width: isCollapsed ? '80px' : 'auto', // Adjust for content
            overflowX: 'auto', // Ensure scrollbar for long content
            transition: 'width 0.3s', // Smooth transition when toggling
            display: 'flex', // Add flex display for aligning children
            flexDirection: 'column', // Arrange children in a column
            justifyContent: 'space-between', // Push content to top and bottom
          },
        }}
      >
        <Menu>
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: '10px 0 20px 0',
              color: colors.neutralLight,
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h5" color={colors.neutralLight} style={{whiteSpace: 'pre-line',  textAlign: 'center'}}>
                  Portfolio {'\n'} Management
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon style={{ color: colors.neutralLight }} />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {/* Menu Items */}
          <MenuItem
            key={"dashboard"}
            component={<Link to="/dashboard" />}  
            icon={<HomeOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Dashboard
          </MenuItem>
          <SubMenu
            key={"portfolios"}
            icon={<AccountBalanceWalletOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
            label="Portfolios"
          >

             {portfolios.map((portfolio) => (
             <MenuItem
              key={portfolio}
              component={<Link to={`/portfolios?portfolio_name=${portfolio}`} />}
              icon={<span style={{ width: "24px", display: "inline-block" }}></span>}
              style={{ color: colors.neutralLight, background: colors.primary }}
             >
             {portfolio}
             </MenuItem>
             ))}
             
             <MenuItem
              key={"create portfolio"}
              style={{ color: colors.neutralLight , background: colors.primary}}
              icon={<AddIcon style={{ color: colors.secondary }} />}
              onClick={() => setOpenPortfolioPopup(true)}
             >
              Create Portfolio
             </MenuItem>
          </SubMenu>
          
          {!isCollapsed && (
            <Typography
            variant="h6"
            color={colors.neutralMain}
            sx={{ m: '15px 0 5px 20px' }}
          >Performance</Typography>
          )}

          <SubMenu
            key={"charts"}
            icon={<ShowChartOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
            label="Charts"
          >
            
             {portfolios.map((portfolio) => (
             <MenuItem
              key={portfolio}
              component={<Link to={`/charts?portfolio_name=${portfolio}`} />}
              icon={<span style={{ width: "24px", display: "inline-block" }}></span>}
              style={{ color: colors.neutralLight, background: colors.primary }}
             >
             {portfolio}
             </MenuItem>
             ))}
          </SubMenu>
          
          <MenuItem
            key={"dividends"}
            component={<Link to="/dividends" />}
            icon={<PaymentsOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Dividends
          </MenuItem>


          {!isCollapsed && (
            <Typography
            variant="h6"
            color={colors.neutralMain}
            sx={{ m: '15px 0 5px 20px' }}
          >
            Analytics
          </Typography>

          )}
          
          <MenuItem
            key={"investments"}
            component={<Link to="/investments" />}
            icon={<AttachMoneyOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Investments
          </MenuItem>

          <MenuItem
            key={"risk"}
            component={<Link to="/risk" />}
            icon={<WarningAmberOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Risk
          </MenuItem>

          <MenuItem
            key={"industries"}
            component={<Link to="/industries" />}
            icon={<FactoryOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Industries
          </MenuItem>
         
          
        </Menu>
        {!isCollapsed && (
          <div style={{ alignItems: 'center',display:'flex', justifyContent: 'center', padding:'10px', color:'white' }}> <FontAwesomeIcon icon={faGithub} style={{ fontSize: '20px' }} />
            <a href='https://github.com/PetrosKots/portfolio-management' target="_blank" >Github Repository</a>
          </div>

        )}
      </Sidebar>
      <Popup open={openPortfolioPopup} onClose={() => setOpenPortfolioPopup(false)} />
    </div>
  );
};

export default HomeSidebar;
