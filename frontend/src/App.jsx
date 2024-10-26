import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Main from './Components/main';
import Session from './Components/session';
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <div>
        {/* Navbar */}
        <Routes>
          <Route path='/' element={<Main/>}/>
          <Route path='/session' element={<Session/>}/>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
