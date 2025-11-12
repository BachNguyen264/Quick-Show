import React from 'react'
import { Link } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import FeaturedSection from '../components/FeaturedSection'
import TrailerSection from '../components/TrailerSection'

const Home = () => {
  return (
    <>
      <HeroSection />
      <FeaturedSection />
      <TrailerSection />
    </>
  )
}

export default Home