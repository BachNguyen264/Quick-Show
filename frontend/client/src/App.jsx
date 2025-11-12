import React from 'react'
import { Route, Routes } from 'react-router-dom'

import Navbar from './components/Navbar'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBooking'
import Favorite from './pages/Favorite'

function App() {
  return(
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/movies' element={<Movies />}/>
        <Route path='/movies/:id' element={<MovieDetails />}/>
        <Route path='/movies/:id/:date' element={<SeatLayout />}/>
        <Route path='/mybooking' element={<MyBookings />}/>
        <Route path='/favorite' element={<Favorite/>} />
      </Routes>
    </>
  )
}

export default App