import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { ArrowRight, Calendar1Icon, ClockIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const HeroSection = () => {

  const navigate = useNavigate();
  const { shows, image_base_url, axios} = useAppContext();
  const [bgImage, setBgImage] = useState(null);

  const getImage = async ()=> {
    const { data } = await axios.get('/api/show/all');
    
    const backdrop_path = data.shows[0].backdrop_path;
    const imgLink = image_base_url + backdrop_path
    return imgLink;
  }

  console.log(shows[0]);

  useEffect(()=> {
    const loadImage = async () => {
      const img = await getImage();
      setBgImage(img);
    };
    loadImage();
  },[])

  return (
    <div
      style={{
      backgroundImage: bgImage ? `url(${bgImage})` : "none",
      }}
      className={`flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen`}>

      <img src={assets.disneyLogo} alt="" className='max-h-11 lg:h-11 mt-20'/>

      <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold'>Guardians <br /> of the Galaxy</h1>

      <div className='flex items-center gap-4 text-gray-300'>
        <span>Action | Adventure | Sci-fi</span>
        <div className='flex items-center gap-1'>
          <Calendar1Icon className="w-4.5 h-4.5"/> 2018
        </div>
        <div className='flex items-center gap-1'>
          <ClockIcon className='w-4.5 h-4.5'/> 2h 8m
        </div>
      </div>
      <p className='max-w-md text-gray-300'>In a post-apocalyptic world where cities ride on wheels and consume each other to survive, two people meet in London and try to stop a conspiracy.</p>
      <button onClick={()=> navigate('/movies')} className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
        Explore Movies
        <ArrowRight className='w-5 h-5'/>
      </button>
    </div>
  )
}

export default HeroSection