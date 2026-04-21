import { useState } from 'react'
import './App.css'

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)

  // REPLACE WITH YOUR ACTUAL API KEY
  const API_KEY = 'YOUR_API_KEY_HERE'

  const fetchWeather = async (searchCity) => {
    if (!searchCity) return
    
    setLoading(true)
    setError('')
    
    try {
      // Fetch current weather
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${API_KEY}&units=metric`
      )
      
      if (!weatherResponse.ok) {
        throw new Error('City not found. Please check the spelling.')
      }
      
      const weatherData = await weatherResponse.json()
      setWeather(weatherData)

      // Fetch 5-day forecast
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${searchCity}&appid=${API_KEY}&units=metric`
      )
      
      const forecastData = await forecastResponse.json()
      
      // Filter to get one forecast per day (every 8th item = 24 hours)
      const dailyForecast = forecastData.list.filter((_, index) => index % 8 === 0).slice(0, 5)
      setForecast(dailyForecast)
      
    } catch (err) {
      setError(err.message)
      setWeather(null)
      setForecast(null)
    } finally {
      setLoading(false)
    }
  }

  // NEW: Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true)
    setError('')

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding to get city name from coordinates
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          )
          
          if (!response.ok) {
            throw new Error('Unable to get location weather')
          }
          
          const data = await response.json()
          setCity(data.name)
          // Fetch weather for the detected city
          await fetchWeather(data.name)
          
        } catch (err) {
          setError('Unable to get weather for your location')
        } finally {
          setLocationLoading(false)
        }
      },
      (error) => {
        setLocationLoading(false)
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError('Please allow location access to use this feature')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable')
            break
          case error.TIMEOUT:
            setError('Location request timed out')
            break
          default:
            setError('An error occurred getting your location')
        }
      }
    )
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchWeather(city)
    }
  }

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  }

  const getDayName = (dateString) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const date = new Date(dateString)
    return days[date.getDay()]
  }

  return (
    <div className="app">
      <div className="container">
        <h1>🌤️ Weather App</h1>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={() => fetchWeather(city)}>
            Search
          </button>
        </div>

        {/* NEW: My Location Button */}
        <div className="location-button-container">
          <button 
            onClick={getCurrentLocation} 
            className="location-btn"
            disabled={locationLoading}
          >
            {locationLoading ? '📍 Getting location...' : '📍 Use My Current Location'}
          </button>
        </div>

        {loading && (
          <div className="loading">
            Loading weather data...
          </div>
        )}

        {error && (
          <div className="error">
            ❌ {error}
          </div>
        )}

        {weather && !loading && (
          <>
            {/* Current Weather */}
            <div className="weather-card">
              <div className="weather-header">
                <h2>{weather.name}, {weather.sys.country}</h2>
                <img 
                  src={getWeatherIcon(weather.weather[0].icon)} 
                  alt={weather.weather[0].description}
                />
              </div>
              
              <div className="temperature">
                {Math.round(weather.main.temp)}°C
              </div>
              
              <div className="description">
                {weather.weather[0].description}
              </div>
              
              <div className="details">
                <div className="detail">
                  <span className="detail-icon">💧</span>
                  <div>
                    <div>Humidity</div>
                    <strong>{weather.main.humidity}%</strong>
                  </div>
                </div>
                <div className="detail">
                  <span className="detail-icon">💨</span>
                  <div>
                    <div>Wind Speed</div>
                    <strong>{Math.round(weather.wind.speed)} km/h</strong>
                  </div>
                </div>
                <div className="detail">
                  <span className="detail-icon">🌡️</span>
                  <div>
                    <div>Feels Like</div>
                    <strong>{Math.round(weather.main.feels_like)}°C</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast Section */}
            {forecast && (
              <div className="forecast-section">
                <h3>5-Day Forecast</h3>
                <div className="forecast-container">
                  {forecast.map((day, index) => (
                    <div key={index} className="forecast-card">
                      <div className="forecast-day">{getDayName(day.dt_txt)}</div>
                      <img 
                        src={getWeatherIcon(day.weather[0].icon)} 
                        alt={day.weather[0].description}
                        className="forecast-icon"
                      />
                      <div className="forecast-temp">{Math.round(day.main.temp)}°C</div>
                      <div className="forecast-desc">{day.weather[0].description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!weather && !loading && !error && (
          <div className="welcome">
            <p>🔍 Enter a city name to see current weather</p>
            <p className="example">Example: Lagos, Abuja, Ibadan, London</p>
            <p className="example">📍 Or click "Use My Current Location"</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App