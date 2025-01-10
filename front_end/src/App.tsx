import React from 'react'
import { Route, Routes } from 'react-router-dom'
import './globals.css'
import SigninForm from './_auth/forms/SigninForm'
import { Home } from './_root/pages'
import SignupForm from './_auth/forms/SignupForm'
import AuthLayout from './_auth/AuthLayout'
import RootLayout from './_root/RootLayout'

const App = () => {
  return (

    <main className='fles h-screen'> 
       
      <Routes>
        {/* public routes */}
        <Route element={<AuthLayout />}>

          <Route path="/sign-in" element={<SigninForm />}/>
          <Route path="/sign-up" element={<SignupForm />}/>
  
        </Route>
        


        {/* private routes */}
        <Route element={<RootLayout/>}>
          <Route path='/' element={<Home />}/>
          <Route path='/home' element={<Home />}/>
          <Route path='/dashboard' element={<Home />}/>
          <Route path='/portfolios' element={<Home />}/>
          <Route path='/charts' element={<Home />}/>
          <Route path='/investments' element={<Home />}/>
          <Route path='/risk' element={<Home />}/>
          <Route path='/industries' element={<Home />}/>


        </Route> 
      </Routes>
      
    </main>
    
  )
}

export default App
