import React from 'react'
import { Outlet, Navigate } from 'react-router-dom';
const AuthLayout = () => {
  return (
    <section>
          <Outlet/>
    </section>
  )
}

export default AuthLayout