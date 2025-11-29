import React, { useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { ArrowRight, Calendar1Icon, ClockIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import timeFormat from '../lib/timeFormat'

const HeroSection = () => {

  const navigate = useNavigate();
  const { image_base_url, axios} = useAppContext();
  const [bgImage, setBgImage] = useState(null);
  const [title, setTitle] = useState(null);
  const [showGenre, setShowGenre] = useState([]);
  const [releaseDate, setReleaseDate] = useState(null);
  const [runTime, setRunTime] = useState(null);
  const [overview, setOverview] = useState(null);

  const getShowInfo = async ()=> {
    const { data } = await axios.get('/api/show/all');
    
    const backdrop_path = data.shows[0].backdrop_path;
    const imgLink = image_base_url + backdrop_path

    const showTitle = data.shows[0].title;
    const genre = data.shows[0].genres;
    const date = data.shows[0].release_date;
    const showRunTime = data.shows[0].runtime;
    const showOverview = data.shows[0].overview;

    setOverview(showOverview);
    setRunTime(showRunTime);
    setReleaseDate(date);
    setShowGenre(genre);
    setTitle(showTitle);
    setBgImage(imgLink);
  }

  useEffect(()=> {
    getShowInfo();
  },[])

  return (
    <div
      style={{
      backgroundImage: bgImage ? `url(${bgImage})` : "none",
      }}
      className={`flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen`}>

      <img src={assets.disneyLogo} alt="" className='max-h-11 lg:h-11 mt-20'/>

      <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold'>{title}</h1>

      <div className='flex items-center gap-4 text-gray-300'>
        <span>{showGenre.map(genre => genre.name).join(" | ")}</span>
        <div className='flex items-center gap-1'>
          <Calendar1Icon className="w-4.5 h-4.5"/> {new Date(releaseDate).getFullYear()}
        </div>
        <div className='flex items-center gap-1'>
          <ClockIcon className='w-4.5 h-4.5'/> {timeFormat(runTime)}
        </div>
      </div>
      <p className='max-w-md text-gray-300'>{overview}</p>
      <button onClick={()=> navigate('/movies')} className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
        Explore Movies
        <ArrowRight className='w-5 h-5'/>
      </button>
    </div>
  )
}

export default HeroSection