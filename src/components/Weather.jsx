import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Weather.css';
import './nav.css';

// Import icons
import search_icon from '../Assets/search.png';
import clear_icon from '../Assets/clear.png';
import cloud_icon from '../Assets/cloud.png';
import drizzle_icon from '../Assets/drizzle.png';
import rain_icon from '../Assets/rain.png';
import snow_icon from '../Assets/snow.png';
import wind_icon from '../Assets/wind.png';
import humidity_icon from '../Assets/humidity.png';

const Weather = () => {
  // ================================
  // ENHANCED STATE MANAGEMENT
  // ================================
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [unit, setUnit] = useState('metric');
  const [favorites, setFavorites] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [weatherHistory, setWeatherHistory] = useState([]);
  const [activeNav, setActiveNav] = useState('weather');

  // Enhanced features
  const [weatherInsights, setWeatherInsights] = useState([]);
  const [weatherTrends, setWeatherTrends] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs
  const searchInputRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  
  // API Configuration
  const API_KEY = import.meta.env.VITE_API_ID;
  const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

  // ================================
  // ENHANCED WEATHER ICONS MAPPING
  // ================================
  const weatherIcons = {
    '01d': clear_icon, '01n': clear_icon,
    '02d': cloud_icon, '02n': cloud_icon,
    '03d': cloud_icon, '03n': cloud_icon,
    '04d': cloud_icon, '04n': cloud_icon,
    '09d': drizzle_icon, '09n': drizzle_icon,
    '10d': rain_icon, '10n': rain_icon,
    '11d': rain_icon, '11n': rain_icon,
    '13d': snow_icon, '13n': snow_icon,
    '50d': cloud_icon, '50n': cloud_icon
  };

  // ================================
  // ENHANCED UTILITY FUNCTIONS
  // ================================
  
  // Show notification with auto-dismiss
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 5000);
  }, []);

  // Enhanced error handling
  const handleError = useCallback((error, fallbackMessage = 'An error occurred') => {
    console.error('Weather App Error:', error);
    const errorMessage = error?.message || fallbackMessage;
    setError(errorMessage);
    showNotification(errorMessage, 'error');
  }, [showNotification]);

  // Format temperature with proper unit display
  const formatTemperature = useCallback((temp) => {
    return `${Math.round(temp)}°${unit === 'metric' ? 'C' : 'F'}`;
  }, [unit]);

  // Enhanced time formatting
  const formatTime = useCallback((timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, []);

  // Enhanced date formatting
  const formatDate = useCallback((timestamp) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Get wind direction with enhanced accuracy
  const getWindDirection = useCallback((deg) => {
    const directions = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    return directions[Math.round(deg / 22.5) % 16];
  }, []);

  // Enhanced UV index calculation
  const calculateUVIndex = useCallback((weatherData) => {
    if (!weatherData) return null;

    const now = new Date();
    const sunrise = new Date(weatherData.sys.sunrise * 1000);
    const sunset = new Date(weatherData.sys.sunset * 1000);
    const isDaytime = now >= sunrise && now <= sunset;
    
    if (!isDaytime) return 0;

    const condition = weatherData.weather[0].main.toLowerCase();
    const cloudCover = weatherData.clouds?.all || 0;
    const lat = Math.abs(weatherData.coord.lat);
    
    // Base UV calculation with latitude consideration
    let baseUV = Math.max(1, 11 - lat / 8);
    
    // Adjust for cloud cover
    if (cloudCover > 80) baseUV *= 0.2;
    else if (cloudCover > 60) baseUV *= 0.4;
    else if (cloudCover > 40) baseUV *= 0.6;
    else if (cloudCover > 20) baseUV *= 0.8;

    // Adjust for weather conditions
    switch (condition) {
      case 'clear': baseUV *= 1.2; break;
      case 'clouds': baseUV *= 0.7; break;
      case 'rain': case 'drizzle': baseUV *= 0.3; break;
      case 'thunderstorm': baseUV *= 0.1; break;
      case 'snow': baseUV *= 0.8; break;
      default: baseUV *= 0.9;
    }

    return Math.max(0, Math.min(11, Math.round(baseUV)));
  }, []);

  // Enhanced air quality descriptions
  const getAirQualityInfo = useCallback((aqi) => {
    const aqiLevels = [
      { level: 'Good', color: '#4ade80', description: 'Air quality is satisfactory' },
      { level: 'Fair', color: '#facc15', description: 'Acceptable for most people' },
      { level: 'Moderate', color: '#f97316', description: 'Sensitive groups should limit outdoor activities' },
      { level: 'Poor', color: '#ef4444', description: 'Everyone should limit outdoor activities' },
      { level: 'Very Poor', color: '#991b1b', description: 'Health warnings of emergency conditions' }
    ];
    
    return aqiLevels[aqi - 1] || { level: 'Unknown', color: '#6b7280', description: 'Data unavailable' };
  }, []);

  // ================================
  // ENHANCED WEATHER INSIGHTS
  // ================================
  const generateWeatherInsights = useCallback((data) => {
    if (!data) return;

    const insights = [];
    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind?.speed || 0;
    const visibility = data.visibility || 10000;
    const condition = data.weather[0].main.toLowerCase();

    // Temperature insights
    if (temp > 35) {
      insights.push({
        icon: '🔥',
        title: 'Extreme Heat Alert',
        description: 'Dangerous heat levels. Avoid prolonged sun exposure and stay hydrated.',
        type: 'warning'
      });
    } else if (temp > 30) {
      insights.push({
        icon: '🌡️',
        title: 'High Temperature',
        description: 'Hot weather ahead. Stay cool and drink plenty of water.',
        type: 'warning'
      });
    } else if (temp < 0) {
      insights.push({
        icon: '🧊',
        title: 'Freezing Conditions',
        description: 'Temperature below freezing. Watch for ice and dress warmly.',
        type: 'warning'
      });
    } else if (temp < 5) {
      insights.push({
        icon: '❄️',
        title: 'Cold Weather',
        description: 'Chilly conditions. Layer up and stay warm.',
        type: 'info'
      });
    }

    // Humidity insights
    if (humidity > 85) {
      insights.push({
        icon: '💧',
        title: 'Very High Humidity',
        description: 'Muggy conditions. You may feel warmer than the actual temperature.',
        type: 'info'
      });
    } else if (humidity < 30) {
      insights.push({
        icon: '🏜️',
        title: 'Low Humidity',
        description: 'Dry air conditions. Stay hydrated and use moisturizer.',
        type: 'info'
      });
    }

    // Wind insights
    if (windSpeed > 15) {
      insights.push({
        icon: '💨',
        title: 'Strong Winds',
        description: 'Very windy conditions. Secure loose items and drive carefully.',
        type: 'warning'
      });
    } else if (windSpeed > 10) {
      insights.push({
        icon: '🌬️',
        title: 'Breezy Conditions',
        description: 'Moderate winds expected. Be cautious with outdoor activities.',
        type: 'info'
      });
    }

    // Visibility insights
    if (visibility < 3000) {
      insights.push({
        icon: '🌫️',
        title: 'Poor Visibility',
        description: 'Limited visibility. Use headlights and drive slowly.',
        type: 'warning'
      });
    } else if (visibility < 8000) {
      insights.push({
        icon: '👁️',
        title: 'Reduced Visibility',
        description: 'Visibility is somewhat limited. Exercise caution.',
        type: 'info'
      });
    }

    // Activity recommendations
    if (condition.includes('clear') && temp > 15 && temp < 28) {
      insights.push({
        icon: '🌞',
        title: 'Perfect Day Outside',
        description: 'Ideal conditions for outdoor activities and exercise!',
        type: 'tip'
      });
    } else if (condition.includes('rain')) {
      insights.push({
        icon: '☔',
        title: 'Indoor Day',
        description: 'Great weather for indoor activities. Don\'t forget your umbrella!',
        type: 'tip'
      });
    }

    setWeatherInsights(insights);
  }, []);

  // ================================
  // ENHANCED WEATHER TRENDS
  // ================================
  const generateWeatherTrends = useCallback((forecastData) => {
    if (!forecastData || forecastData.length === 0) return;

    const trends = [];
    const temps = forecastData.slice(0, 5).map(day => day.main.temp);
    const humidities = forecastData.slice(0, 5).map(day => day.main.humidity);
    const pressures = forecastData.slice(0, 5).map(day => day.main.pressure);

    // Temperature trend analysis
    const tempTrend = temps.reduce((acc, temp, index) => {
      if (index === 0) return acc;
      const diff = temp - temps[index - 1];
      return acc + (diff > 1 ? 1 : diff < -1 ? -1 : 0);
    }, 0);

    const avgTempChange = temps.length > 1 ? 
      (temps[temps.length - 1] - temps[0]) / (temps.length - 1) : 0;

    if (tempTrend > 1) {
      trends.push({
        icon: '📈',
        title: 'Rising Temperature',
        description: 'Temperatures are trending upward over the forecast period.',
        value: `+${Math.round(avgTempChange)}°`,
        type: 'positive'
      });
    } else if (tempTrend < -1) {
      trends.push({
        icon: '📉',
        title: 'Cooling Trend',
        description: 'Temperatures are expected to drop in the coming days.',
        value: `${Math.round(avgTempChange)}°`,
        type: 'negative'
      });
    }

    // Pressure trend (weather pattern indicator)
    const avgPressure = pressures.reduce((a, b) => a + b, 0) / pressures.length;
    const pressureChange = pressures.length > 1 ? 
      pressures[pressures.length - 1] - pressures[0] : 0;

    if (pressureChange > 5) {
      trends.push({
        icon: '📊',
        title: 'Rising Pressure',
        description: 'High pressure system approaching. Expect clearer skies.',
        value: `+${Math.round(pressureChange)} hPa`,
        type: 'positive'
      });
    } else if (pressureChange < -5) {
      trends.push({
        icon: '🌀',
        title: 'Falling Pressure',
        description: 'Low pressure system. Possible stormy weather ahead.',
        value: `${Math.round(pressureChange)} hPa`,
        type: 'warning'
      });
    }

    // Humidity trend
    const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
    if (avgHumidity > 80) {
      trends.push({
        icon: '💧',
        title: 'High Humidity Period',
        description: 'Expect muggy conditions throughout the forecast.',
        value: `${Math.round(avgHumidity)}%`,
        type: 'info'
      });
    }

    setWeatherTrends(trends);
  }, []);

  // ================================
  // ENHANCED API FUNCTIONS
  // ================================

  // Get current location with better error handling
  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    showNotification('Getting your location...', 'info');

    if (!navigator.geolocation) {
      handleError(new Error('Geolocation not supported by this browser'));
      search("London"); // Fallback
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lon: longitude });
        searchByCoordinates(latitude, longitude);
        showNotification('Location found successfully!', 'success');
      },
      (error) => {
        let errorMessage = 'Location access denied';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        handleError(new Error(errorMessage));
        search("London"); // Fallback
      },
      options
    );
  }, [handleError, showNotification]);

  // Enhanced search with better error handling
  const search = useCallback(async (city) => {
    if (!city.trim()) return;

    setLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      const weatherUrl = `${API_BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${unit}`;
      const response = await fetch(weatherUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setWeatherData(data);
      setLastUpdated(new Date());

      // Update search history
      setWeatherHistory(prev => {
        const filtered = prev.filter(item => item.id !== data.id);
        return [data, ...filtered.slice(0, 4)];
      });

      // Generate insights and get additional data
      generateWeatherInsights(data);
      
      await Promise.allSettled([
        get5DayForecast(data.coord.lat, data.coord.lon),
        getHourlyForecast(data.coord.lat, data.coord.lon),
        getAirQuality(data.coord.lat, data.coord.lon)
      ]);

      showNotification(`Weather data updated for ${data.name}`, 'success');

    } catch (error) {
      handleError(error, 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, [API_KEY, unit, generateWeatherInsights, handleError, showNotification]);

  // Search by coordinates with enhanced error handling
  const searchByCoordinates = useCallback(async (lat, lon) => {
    setLoading(true);
    setError('');

    try {
      const weatherUrl = `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`;
      const response = await fetch(weatherUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get weather data');
      }

      setWeatherData(data);
      setLastUpdated(new Date());
      generateWeatherInsights(data);

      await Promise.allSettled([
        get5DayForecast(lat, lon),
        getHourlyForecast(lat, lon),
        getAirQuality(lat, lon)
      ]);

    } catch (error) {
      handleError(error, 'Failed to get weather for your location');
      search("London"); // Fallback
    } finally {
      setLoading(false);
    }
  }, [API_KEY, unit, generateWeatherInsights, handleError, search]);

  // Enhanced forecast fetching
  const get5DayForecast = useCallback(async (lat, lon) => {
    try {
      const forecastUrl = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`;
      const response = await fetch(forecastUrl);
      const data = await response.json();

      if (response.ok) {
        const dailyForecast = data.list.filter((_, index) => index % 8 === 0).slice(0, 5);
        setForecast(dailyForecast);
        generateWeatherTrends(dailyForecast);
      }
    } catch (error) {
      console.warn('Failed to fetch 5-day forecast:', error);
    }
  }, [API_KEY, unit, generateWeatherTrends]);

  // Enhanced hourly forecast
  const getHourlyForecast = useCallback(async (lat, lon) => {
    try {
      const hourlyUrl = `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`;
      const response = await fetch(hourlyUrl);
      const data = await response.json();

      if (response.ok) {
        setHourlyForecast(data.list.slice(0, 24));
      }
    } catch (error) {
      console.warn('Failed to fetch hourly forecast:', error);
    }
  }, [API_KEY, unit]);

  // Enhanced air quality fetching
  const getAirQuality = useCallback(async (lat, lon) => {
    try {
      const aqiUrl = `${API_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
      const response = await fetch(aqiUrl);
      const data = await response.json();

      if (response.ok && data.list?.length > 0) {
        setAirQuality(data.list[0]);
      }
    } catch (error) {
      console.warn('Failed to fetch air quality:', error);
    }
  }, [API_KEY]);

  // ================================
  // ENHANCED EVENT HANDLERS
  // ================================

  // Enhanced navigation handler
  const handleNavClick = useCallback((navItem) => {
    setActiveNav(navItem);
    setMobileMenuOpen(false);
    setError(''); // Clear any errors when switching sections
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showNotification(`Switched to ${navItem} section`, 'info');
  }, [showNotification]);

  // Enhanced search handler
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (query) {
      search(query);
      setSearchInput(''); // Clear input after search
    }
  }, [search, searchInput]);

  // Enhanced unit toggle
  const toggleUnit = useCallback(() => {
    const newUnit = unit === 'metric' ? 'imperial' : 'metric';
    setUnit(newUnit);
    showNotification(`Switched to ${newUnit === 'metric' ? 'Celsius' : 'Fahrenheit'}`, 'info');

    // Re-fetch data with new units
    if (weatherData) {
      if (currentLocation) {
        searchByCoordinates(currentLocation.lat, currentLocation.lon);
      } else {
        search(weatherData.name);
      }
    }
  }, [unit, weatherData, currentLocation, searchByCoordinates, search, showNotification]);

  // Enhanced favorites management
  const addToFavorites = useCallback(() => {
    if (!weatherData) return;
    
    const isAlreadyFavorite = favorites.some(fav => fav.id === weatherData.id);
    if (isAlreadyFavorite) {
      showNotification('City is already in favorites', 'warning');
      return;
    }

    const newFavorites = [...favorites, weatherData];
    setFavorites(newFavorites);
    localStorage.setItem('weatherAppFavorites', JSON.stringify(newFavorites));
    showNotification(`Added ${weatherData.name} to favorites`, 'success');
  }, [weatherData, favorites, showNotification]);

  const removeFromFavorites = useCallback((cityId, cityName) => {
    const newFavorites = favorites.filter(fav => fav.id !== cityId);
    setFavorites(newFavorites);
    localStorage.setItem('weatherAppFavorites', JSON.stringify(newFavorites));
    showNotification(`Removed ${cityName} from favorites`, 'info');
  }, [favorites, showNotification]);

  // Refresh weather data
  const refreshWeatherData = useCallback(() => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setIsRefreshing(true);
    if (currentLocation) {
      searchByCoordinates(currentLocation.lat, currentLocation.lon);
    } else if (weatherData) {
      search(weatherData.name);
    } else {
      getCurrentLocation();
    }
    
    setTimeout(() => setIsRefreshing(false), 1000); // Reset refresh state
  }, [loading, currentLocation, weatherData, searchByCoordinates, search, getCurrentLocation]);

  // ================================
  // MOBILE MENU HANDLER - FIXED (NO BLUR)
  // ================================
  const handleMobileMenuToggle = useCallback(() => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);
    // FIXED: Removed body class manipulation that was causing blur
  }, [mobileMenuOpen]);

  // ================================
  // ENHANCED COMPONENT SECTIONS
  // ================================

  // Enhanced notification component
  const NotificationComponent = () => {
    if (!notification) return null;

    return (
      <div className={`notification notification--${notification.type}`}>
        <div className="notification__content">
          <span className="notification__icon">
            {notification.type === 'success' ? '✅' : 
             notification.type === 'warning' ? '⚠️' : 
             notification.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="notification__message">{notification.message}</span>
        </div>
        <button 
          className="notification__close"
          onClick={() => setNotification(null)}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    );
  };

  // Enhanced loading component
  const LoadingComponent = () => (
    <div className="loading">
      <div className="spinner"></div>
      <p>
        {isRefreshing ? 'Refreshing data...' : 'Fetching weather data...'}
      </p>
    </div>
  );

  // Enhanced error component
  const ErrorComponent = () => (
    error && (
      <div className="error">
        <div className="error__content">
          <span className="error__icon">⚠️</span>
          <span className="error__message">{error}</span>
        </div>
        <div className="error__actions">
          <button onClick={() => setError('')} className="error__dismiss">
            Dismiss
          </button>
          <button onClick={refreshWeatherData} className="error__retry">
            Retry
          </button>
        </div>
      </div>
    )
  );

  // ================================
  // ENHANCED RENDER SECTIONS
  // ================================

  const renderWeatherSection = () => {
    if (!weatherData) return null;

    const uvIndex = calculateUVIndex(weatherData);
    const isFavorite = favorites.some(fav => fav.id === weatherData.id);

    return (
      <>
        {/* Enhanced Current Weather Card */}
        <div className="current-weather glass-card glass-card--xl">
          <div className="weather-main">
            <img 
              src={weatherIcons[weatherData.weather[0].icon] || clear_icon}
              alt={weatherData.weather[0].description}
              className="weather-icon float-animation"
              loading="lazy"
            />
            
            <div className="temperature-section">
              <p className="temperature glow-on-hover">
                {formatTemperature(weatherData.main.temp)}
              </p>
              <p className="feels-like">
                Feels like {formatTemperature(weatherData.main.feels_like)}
              </p>
              <p className="condition">
                {weatherData.weather[0].description.charAt(0).toUpperCase() + 
                 weatherData.weather[0].description.slice(1)}
              </p>
            </div>

            <div className="location-info">
              <p className="location">
                <span>{weatherData.name}, {weatherData.sys.country}</span>
                <button 
                  className={`favorite-btn ${isFavorite ? 'favorite-btn--active' : ''}`}
                  onClick={addToFavorites}
                  title={isFavorite ? 'Already in favorites' : 'Add to favorites'}
                  disabled={isFavorite}
                >
                  {isFavorite ? '⭐' : '☆'}
                </button>
              </p>
              <p className="coordinates">
                {weatherData.coord.lat.toFixed(2)}°, {weatherData.coord.lon.toFixed(2)}°
              </p>
              {lastUpdated && (
                <p className="last-updated">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Weather Details Grid */}
        <div className="weather-details">
          <div className="detail-card glass-card">
            <img src={humidity_icon} alt="humidity" />
            <div className="detail-content">
              <p className="detail-value">{weatherData.main.humidity}%</p>
              <span className="detail-label">Humidity</span>
            </div>
          </div>

          <div className="detail-card glass-card">
            <img src={wind_icon} alt="wind" />
            <div className="detail-content">
              <p className="detail-value">
                {Math.round(weatherData.wind?.speed * (unit === 'metric' ? 3.6 : 1) || 0)} 
                {unit === 'metric' ? ' km/h' : ' mph'}
              </p>
              <span className="detail-label">Wind Speed</span>
              {weatherData.wind?.deg && (
                <span className="wind-direction">{getWindDirection(weatherData.wind.deg)}</span>
              )}
            </div>
          </div>

          <div className="detail-card glass-card">
            <span className="detail-icon">👁️</span>
            <div className="detail-content">
              <p className="detail-value">
                {Math.round((weatherData.visibility || 10000) / 1000)} km
              </p>
              <span className="detail-label">Visibility</span>
            </div>
          </div>

          <div className="detail-card glass-card">
            <span className="detail-icon">📊</span>
            <div className="detail-content">
              <p className="detail-value">{weatherData.main.pressure} hPa</p>
              <span className="detail-label">Pressure</span>
            </div>
          </div>

          <div className="detail-card glass-card">
            <span className="detail-icon">🌅</span>
            <div className="detail-content">
              <p className="detail-value">{formatTime(weatherData.sys.sunrise)}</p>
              <span className="detail-label">Sunrise</span>
            </div>
          </div>

          <div className="detail-card glass-card">
            <span className="detail-icon">🌇</span>
            <div className="detail-content">
              <p className="detail-value">{formatTime(weatherData.sys.sunset)}</p>
              <span className="detail-label">Sunset</span>
            </div>
          </div>

          {uvIndex !== null && (
            <div className="detail-card glass-card">
              <span className="detail-icon">☀️</span>
              <div className="detail-content">
                <p className="detail-value">{uvIndex}</p>
                <span className="detail-label">UV Index</span>
                <span className={`uv-level uv-level--${uvIndex <= 2 ? 'low' : uvIndex <= 5 ? 'moderate' : uvIndex <= 7 ? 'high' : 'extreme'}`}>
                  {uvIndex <= 2 ? 'Low' : uvIndex <= 5 ? 'Moderate' : uvIndex <= 7 ? 'High' : uvIndex <= 10 ? 'Very High' : 'Extreme'}
                </span>
              </div>
            </div>
          )}

          {airQuality && (
            <div className="detail-card glass-card">
              <span className="detail-icon">🌬️</span>
              <div className="detail-content">
                <p className="detail-value">{airQuality.main.aqi}</p>
                <span className="detail-label">Air Quality</span>
                <span className={`aqi-level aqi-level--${airQuality.main.aqi}`}>
                  {getAirQualityInfo(airQuality.main.aqi).level}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Weather Insights */}
        {weatherInsights.length > 0 && (
          <div className="weather-insights glass-card glass-card--lg">
            <h3>💡 Weather Insights</h3>
            <div className="insights-grid">
              {weatherInsights.map((insight, index) => (
                <div key={index} className={`insight-card insight-card--${insight.type}`}>
                  <span className="insight-icon">{insight.icon}</span>
                  <div className="insight-content">
                    <h4>{insight.title}</h4>
                    <p>{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Weather Trends */}
        {weatherTrends.length > 0 && (
          <div className="weather-trends glass-card glass-card--lg">
            <h3>📈 Weather Trends</h3>
            <div className="trends-grid">
              {weatherTrends.map((trend, index) => (
                <div key={index} className={`trend-card trend-card--${trend.type}`}>
                  <span className="trend-icon">{trend.icon}</span>
                  <div className="trend-content">
                    <h4>{trend.title}</h4>
                    <p>{trend.description}</p>
                    <span className="trend-value">{trend.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderForecastSection = () => (
    <>
      {/* Enhanced Hourly Forecast */}
      {hourlyForecast.length > 0 && (
        <div className="hourly-forecast glass-card glass-card--lg">
          <h3>🕐 24-Hour Forecast</h3>
          <div className="hourly-scroll">
            {hourlyForecast.map((hour, index) => (
              <div key={index} className="hourly-item glass-card glass-card--sm">
                <span className="hour-time">
                  {index === 0 ? 'Now' : formatTime(hour.dt)}
                </span>
                <img 
                  src={weatherIcons[hour.weather[0].icon] || clear_icon}
                  alt={hour.weather[0].description}
                  className="hour-icon"
                  loading="lazy"
                />
                <span className="hour-temp">
                  {formatTemperature(hour.main.temp)}
                </span>
                <span className="hour-condition">
                  {hour.weather[0].main}
                </span>
                <span className="hour-rain">
                  💧 {Math.round((hour.pop || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced 5-Day Forecast */}
      {forecast.length > 0 && (
        <div className="forecast glass-card glass-card--lg">
          <h3>📅 5-Day Forecast</h3>
          <div className="forecast-grid">
            {forecast.map((day, index) => (
              <div key={index} className="forecast-item glass-card glass-card--sm">
                <span className="forecast-day">
                  {formatDate(day.dt)}
                </span>
                <img 
                  src={weatherIcons[day.weather[0].icon] || clear_icon}
                  alt={day.weather[0].description}
                  className="forecast-icon"
                  loading="lazy"
                />
                <div className="forecast-temps">
                  <span className="temp-high">
                    {formatTemperature(day.main.temp_max)}
                  </span>
                  <span className="temp-low">
                    {formatTemperature(day.main.temp_min)}
                  </span>
                </div>
                <span className="forecast-condition">
                  {day.weather[0].main}
                </span>
                <span className="forecast-rain">
                  💧 {Math.round((day.pop || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const renderAirQualitySection = () => {
    const aqiInfo = airQuality ? getAirQualityInfo(airQuality.main.aqi) : null;
    
    return (
      <div className="air-quality-section glass-card glass-card--lg">
        <h3>🌬️ Air Quality Information</h3>
        {airQuality ? (
          <>
            <div className="aqi-overview">
              <div className="aqi-main">
                <div 
                  className="aqi-value"
                  style={{ '--aqi-color': aqiInfo.color }}
                >
                  <span className="aqi-number">{airQuality.main.aqi}</span>
                  <span className="aqi-description">{aqiInfo.level}</span>
                </div>
                <div className="aqi-info">
                  <h4>Air Quality Index</h4>
                  <p>{aqiInfo.description}</p>
                </div>
              </div>
            </div>

            <div className="air-quality-details">
              <h4>🧪 Pollutant Breakdown</h4>
              <div className="aqi-components">
                {Object.entries({
                  'CO': { value: airQuality.components.co, name: 'Carbon Monoxide' },
                  'NO₂': { value: airQuality.components.no2, name: 'Nitrogen Dioxide' },
                  'O₃': { value: airQuality.components.o3, name: 'Ozone' },
                  'PM2.5': { value: airQuality.components.pm2_5, name: 'Fine Particles' },
                  'PM10': { value: airQuality.components.pm10, name: 'Coarse Particles' },
                  'SO₂': { value: airQuality.components.so2, name: 'Sulfur Dioxide' }
                }).map(([key, data]) => (
                  <div key={key} className="aqi-item glass-card glass-card--sm">
                    <div className="aqi-item__header">
                      <span className="aqi-item__symbol">{key}</span>
                      <span className="aqi-item__value">{Math.round(data.value)} μg/m³</span>
                    </div>
                    <div className="aqi-item__name">{data.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="no-data">
            <div className="no-data__icon">📊</div>
            <h4>No Air Quality Data</h4>
            <p>Air quality information is not available for this location.</p>
          </div>
        )}
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeNav) {
      case 'weather':
        return renderWeatherSection();
      case 'forecast':
        return renderForecastSection();
      case 'air-quality':
        return renderAirQualitySection();
      case 'alerts':
        return (
          <div className="alerts-section glass-card glass-card--lg">
            <h3>⚠️ Weather Alerts</h3>
            {alerts.length > 0 ? (
              <div className="alerts-container">
                {alerts.map((alert, index) => (
                  <div key={index} className="alert-card glass-card glass-card--sm">
                    <strong>⚠️ {alert.event}</strong>
                    <p>{alert.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <div className="no-data__icon">✅</div>
                <h4>No Active Alerts</h4>
                <p>There are currently no weather alerts for this location.</p>
              </div>
            )}
          </div>
        );
      case 'maps':
        return (
          <div className="maps-section glass-card glass-card--lg">
            <h3>🗺️ Weather Maps</h3>
            <div className="maps-placeholder">
              <div className="no-data">
                <div className="no-data__icon">🌍</div>
                <h4>Interactive Weather Maps</h4>
                <p>Weather radar and interactive maps coming soon!</p>
                
                <div className="coming-features">
                  <h5>Planned Features:</h5>
                  <div className="features-grid">
                    <div className="feature-item">🌧️ Precipitation Radar</div>
                    <div className="feature-item">🛰️ Satellite Imagery</div>
                    <div className="feature-item">🌪️ Storm Tracking</div>
                    <div className="feature-item">🌡️ Temperature Maps</div>
                    <div className="feature-item">💨 Wind Visualization</div>
                    <div className="feature-item">☁️ Cloud Cover</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ================================
  // ENHANCED EFFECTS - FIXED (NO BLUR)
  // ================================

  // CRITICAL: Fixed Mobile menu handler effect
  useEffect(() => {
    const handleMobileMenu = () => {
      const toggle = document.querySelector('.mobile-menu-toggle');
      const menu = document.querySelector('.navbar-menu');
      const overlay = document.querySelector('.menu-overlay');

      if (toggle && menu) {
        const handleToggleClick = () => {
          const isActive = menu.classList.contains('active');
          
          toggle.classList.toggle('active', !isActive);
          menu.classList.toggle('active', !isActive);
          // FIXED: Removed body.classList.toggle('menu-open', !isActive);
          
          if (overlay) {
            overlay.classList.toggle('active', !isActive);
          }
          
          // Update ARIA for accessibility
          toggle.setAttribute('aria-expanded', !isActive);
          setMobileMenuOpen(!isActive);
        };

        toggle.addEventListener('click', handleToggleClick);

        // Close menu when clicking links
        const navLinks = document.querySelectorAll('.navbar-link');
        navLinks.forEach(link => {
          const handleLinkClick = () => {
            if (window.innerWidth <= 768) {
              toggle.classList.remove('active');
              menu.classList.remove('active');
              // FIXED: Removed body.classList.remove('menu-open');
              if (overlay) overlay.classList.remove('active');
              toggle.setAttribute('aria-expanded', 'false');
              setMobileMenuOpen(false);
            }
          };
          link.addEventListener('click', handleLinkClick);
        });

        // Close menu when clicking overlay
        if (overlay) {
          const handleOverlayClick = () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            // FIXED: Removed body.classList.remove('menu-open');
            overlay.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            setMobileMenuOpen(false);
          };
          overlay.addEventListener('click', handleOverlayClick);
        }

        // Cleanup
        return () => {
          toggle.removeEventListener('click', handleToggleClick);
          navLinks.forEach(link => {
            link.removeEventListener('click', () => {});
          });
          if (overlay) {
            overlay.removeEventListener('click', () => {});
          }
        };
      }
    };

    handleMobileMenu();
  }, []);

  // Auto-refresh with enhanced interval management
  useEffect(() => {
    if (!weatherData) return;

    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') { // Only refresh when tab is visible
        refreshWeatherData();
      }
    }, 600000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [weatherData, refreshWeatherData]);

  // Initial load with better error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem('weatherAppFavorites');
        if (savedFavorites) {
          setFavorites(JSON.parse(savedFavorites));
        }

        // Load theme preference
        const savedTheme = localStorage.getItem('weatherAppTheme') || 'dark';
        setTheme(savedTheme);

        // Get initial weather data
        getCurrentLocation();
      } catch (error) {
        console.error('Failed to initialize app:', error);
        handleError(error, 'Failed to initialize the weather app');
      }
    };

    initializeApp();
  }, [getCurrentLocation, handleError]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'r':
            e.preventDefault();
            refreshWeatherData();
            break;
        }
      }
      
      // Navigation shortcuts
      if (e.altKey) {
        switch (e.key) {
          case '1': handleNavClick('weather'); break;
          case '2': handleNavClick('forecast'); break;
          case '3': handleNavClick('alerts'); break;
          case '4': handleNavClick('air-quality'); break;
          case '5': handleNavClick('maps'); break;
        }
      }

      // Escape key actions
      if (e.key === 'Escape') {
        setError('');
        setNotification(null);
        setMobileMenuOpen(false);
        setShowSuggestions(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [refreshWeatherData, handleNavClick]);

  // Cleanup notification timeout
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // ================================
  // MAIN RENDER
  // ================================

  return (
    <div className={`weather ${theme} ${weatherData ? weatherData.weather[0].main.toLowerCase() : ''}`}>
      {/* Enhanced Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-top">
            {/* Brand */}
            <div className="navbar-brand">
              <h1 className="brand-name">Doby</h1>
              <span className="brand-subtitle">Weather Intelligence</span>
            </div>

            {/* Navigation Menu */}
            <ul className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
              {[
                { id: 'weather', label: '🌤️ Weather' },
                { id: 'forecast', label: '📅 Forecast' },
                { id: 'alerts', label: '⚠️ Alerts' },
                { id: 'air-quality', label: '🌬️ Air Quality' },
                { id: 'maps', label: '🗺️ Maps' }
              ].map(nav => (
                <li key={nav.id} className="navbar-item">
                  <button
                    className={`navbar-link ${activeNav === nav.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(nav.id)}
                  >
                    {nav.label}
                  </button>
                </li>
              ))}
            </ul>

            {/* Mobile Menu Toggle */}
            <button 
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={handleMobileMenuToggle}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>

          {/* Control Buttons Row */}
          <div className="navbar-controls">
            <div className="header-controls">
              <button 
                className="control-btn location-btn"
                onClick={getCurrentLocation}
                disabled={loading}
                data-tooltip="Get Location"
                aria-label="Get current location"
              >
                📍
              </button>
              <button 
                className="control-btn unit-toggle"
                onClick={toggleUnit}
                data-tooltip={`Switch to °${unit === 'metric' ? 'F' : 'C'}`}
                aria-label="Toggle temperature unit"
              >
                °{unit === 'metric' ? 'C' : 'F'}
              </button>
              <button 
                className="control-btn theme-toggle"
                onClick={() => {
                  const newTheme = theme === 'light' ? 'dark' : 'light';
                  setTheme(newTheme);
                  localStorage.setItem('weatherAppTheme', newTheme);
                }}
                data-tooltip="Toggle Theme"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button 
                className="control-btn advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                data-tooltip="Advanced View"
                aria-label="Toggle advanced view"
              >
                {showAdvanced ? '📊' : '📋'}
              </button>
              <button 
                className="control-btn refresh-btn"
                onClick={refreshWeatherData}
                disabled={loading}
                data-tooltip="Refresh Data"
                aria-label="Refresh weather data"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Overlay for Mobile */}
      <div className={`menu-overlay ${mobileMenuOpen ? 'active' : ''}`}></div>

      {/* Enhanced Search Bar */}
      <form onSubmit={handleSearch} className="search-bar glass-card">
        <input 
          ref={searchInputRef}
          type="text"
          placeholder="Search city... (Ctrl+K)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          disabled={loading}
          className="navbar-search-input"
        />
        <button 
          type="submit" 
          disabled={loading || !searchInput.trim()}
          className="ripple"
          aria-label="Search"
        >
          <img src={search_icon} alt="Search" />
        </button>
      </form>

      {/* Enhanced Favorites */}
      {favorites.length > 0 && (
        <div className="favorites glass-card glass-card--lg">
          <h4>⭐ Favorites</h4>
          <div className="favorites-list">
            {favorites.map(fav => (
              <button 
                key={fav.id}
                className="favorite-item glass-card glass-card--sm"
                onClick={() => search(fav.name)}
              >
                <span className="favorite-item__name">{fav.name}</span>
                <span className="favorite-item__temp">{formatTemperature(fav.main.temp)}</span>
                <button 
                  className="favorite-item__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromFavorites(fav.id, fav.name);
                  }}
                  aria-label={`Remove ${fav.name} from favorites`}
                >
                  ×
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Notification System */}
      <NotificationComponent />

      {/* Enhanced Loading State */}
      {loading && <LoadingComponent />}

      {/* Enhanced Error State */}
      <ErrorComponent />

      {/* Main Content Sections */}
      {renderActiveSection()}

      {/* Enhanced Weather History */}
      {activeNav === 'weather' && weatherHistory.length > 1 && (
        <div className="weather-history glass-card glass-card--lg">
          <div className="history-header">
            <h3>🔍 Recent Searches</h3>
            <button 
              onClick={() => {
                setWeatherHistory([]);
                showNotification('Search history cleared', 'info');
              }}
              className="clear-history"
            >
              Clear All
            </button>
          </div>
          <div className="history-list">
            {weatherHistory.slice(1).map((historyItem, index) => (
              <button 
                key={`${historyItem.id}-${index}`}
                className="history-item glass-card glass-card--sm"
                onClick={() => search(historyItem.name)}
              >
                <span className="history-item__name">{historyItem.name}</span>
                <span className="history-item__temp">{formatTemperature(historyItem.main.temp)}</span>
                <span className="history-item__condition">{historyItem.weather[0].main}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Footer */}
      <footer className="weather-footer">
        <p>Weather data provided by OpenWeatherMap API</p>
        <div className="footer-shortcuts">
          <div className="shortcuts-grid">
            <span>Shortcuts:</span>
            <span>Ctrl+K (Search)</span>
            <span>Ctrl+R (Refresh)</span>
            <span>Alt+1-5 (Navigate)</span>
            <span>Esc (Close)</span>
          </div>
        </div>
        {lastUpdated && (
          <p className="last-update-time">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </footer>
    </div>
  );
};

export default Weather;
