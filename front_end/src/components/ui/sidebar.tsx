import React, { useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Sidebar, Menu, MenuItem, sidebarClasses } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import { Box, IconButton, Typography, useTheme } from '@mui/material';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FactoryOutlinedIcon from '@mui/icons-material/FactoryOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';

const HomeSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const theme = useTheme(); // Access the current theme
  const colors = {
    primary: '#1F2A40',
    secondary: '#e0e0e0',
    neutralDark:  '#3d3d3d',
    neutralLight: '#e0e0e0',
    neutralMain: '#666666',
  };

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
            component={<Link to="/dashboard" />}
            
            icon={<HomeOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Dashboard
          </MenuItem>
          <MenuItem
            component={<Link to="/portfolios" />}
            icon={<AccountBalanceWalletOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Portfolios
          </MenuItem>
          
          {!isCollapsed && (
            <Typography
            variant="h6"
            color={colors.neutralMain}
            sx={{ m: '15px 0 5px 20px' }}
          >Performance</Typography>
          )}
          <MenuItem
            component={<Link to="/charts" />}
            icon={<ShowChartOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Charts
          </MenuItem>
          
          <MenuItem
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
            component={<Link to="/investments" />}
            icon={<AttachMoneyOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Investments
          </MenuItem>

          <MenuItem
            component={<Link to="/risk" />}
            icon={<WarningAmberOutlinedIcon style={{ color: colors.secondary }} />}
            style={{ color: colors.neutralLight }}
          >
            Risk
          </MenuItem>

          <MenuItem
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
    </div>
  );
};

export default HomeSidebar;
