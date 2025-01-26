import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { useState, useEffect } from "react";
import './globals.css'
import HomeSidebar from '@/components/ui/sidebar';
import { Home } from './scenes/home'
import Portfolios from './scenes/portfolios'
import RootLayout from './scenes/RootLayout'
import { Sidebar } from 'react-pro-sidebar';
import { fetchUsers } from "./api";


const App = () => {
  const [response, setResponse] = useState("");

  useEffect(() => {
    fetchUsers()
      .then((res) => setResponse(JSON.stringify(res.data, null, 2)))
      .catch((err) => setResponse(`Error: ${err.message}`));
  }, []);
  return (
    
    
    <main className='flex h-screen' style={{ backgroundColor: '#141b2d' }}>
      
      

      <HomeSidebar/>  
       
      <div style={{ flex: 1, padding: '20px' }}>
      <Routes>
        
        


        {/* private routes */}
        <Route element={<RootLayout/>}>
          <Route path='/' element={<Home />}/>
          <Route path='/home' element={<Home />}/>
          <Route path='/dashboard' element={<Home />}/>
          <Route path='/portfolios' element={<Portfolios />}/>
          <Route path='/charts' element={<Home />}/>
          <Route path='/dividends' element={<Home />}/>
          <Route path='/investments' element={<Home />}/>
          <Route path='/risk' element={<Home />}/>
          <Route path='/industries' element={<Home />}/>


        </Route> 
      </Routes>
      </div>
      
    </main>
    
  )
}

export default App
