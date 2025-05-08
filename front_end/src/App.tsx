import React from 'react'
import { Route, Routes } from 'react-router-dom'
import {  useEffect } from "react";
import './globals.css'
import HomeSidebar from '@/components/ui/sidebar';
import { Home } from './scenes/home'
import Portfolios from './scenes/portfolios'
import Charts from './scenes/charts';
import RootLayout from './scenes/RootLayout'
import axios from "axios";

const App = () => {


  

  //post request that fetches the latest closing prices for all the investment
  useEffect(() => {

    const fetchData= () => {axios.post(
      "http://localhost:5000/run-python")
       
    }
    
    //updating the data every 5 seconds
    setInterval(fetchData,5000)
  })
  
  return (
    
    
    <main className='flex h-screen' style={{ backgroundColor: '#141b2d' }}>
      
      
      
      <HomeSidebar/>
      
       
       
      <div style={{ flex: 1, padding: '20px', overflow:'auto' }}>
      <Routes>
        
        


        {/* private routes */}
        <Route element={<RootLayout/>}>
          <Route path='/' element={<Home />}/>
          <Route path='/home' element={<Home />}/>
          <Route path='/dashboard' element={<Home />}/>
          <Route path='/portfolios' element={<Portfolios />}/>
          <Route path='/charts' element={<Charts />}/> 
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
