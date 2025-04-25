import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './DoctorSearch.css';

const API = import.meta.env.VITE_API_URL;


// Extract all unique specialities


// Helper function to extract years from experience string
const extractYears = (expString) => {
  const match = expString.match(/(\d+)/);
  return match ? parseInt(match[0]) : 0;
};

// Helper function to extract fee as number from fee string
const extractFee = (feeString) => {
  const match = feeString.match(/(\d+)/);
  return match ? parseInt(match[0]) : 0;
};

function DoctorSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doctorsData,setDoctorsData] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API)
      .then((response) => response.json())
      .then((json) => {
        setDoctorsData(json);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);
  

 const allSpecialities = [...new Set(doctorsData.flatMap(doctor => 
  doctor.specialities.map(spec => spec.name)
 ))];


  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  
  // State variables
  const [searchQuery, setSearchQuery] = useState(queryParams.get('search') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [consultMode, setConsultMode] = useState(queryParams.get('consultMode') || '');
  const [selectedSpecialities, setSelectedSpecialities] = useState(
    queryParams.getAll('speciality') || []
  );
  const [sortBy, setSortBy] = useState(queryParams.get('sortBy') || '');
  const [filteredDoctors, setFilteredDoctors] = useState(doctorsData);
  
  // Effect to handle URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setConsultMode(params.get('consultMode') || '');
    setSelectedSpecialities(params.getAll('speciality') || []);
    setSortBy(params.get('sortBy') || '');
    setSearchQuery(params.get('search') || '');
  }, [location.search]);
  
  // Effect to filter doctors based on criteria
  useEffect(() => {
    let filtered = [...doctorsData];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by consultation mode
    if (consultMode === 'Video Consultation') {
      filtered = filtered.filter(doctor => doctor.video_consult);
    } else if (consultMode === 'In-clinic Consultation') {
      filtered = filtered.filter(doctor => doctor.in_clinic);
    }
    
    // Filter by specialities
    if (selectedSpecialities.length > 0) {
      filtered = filtered.filter(doctor => 
        doctor.specialities.some(spec => selectedSpecialities.includes(spec.name))
      );
    }
    
    // Apply sorting
    if (sortBy === 'fees') {
      filtered.sort((a, b) => extractFee(a.fees) - extractFee(b.fees));
    } else if (sortBy === 'experience') {
      filtered.sort((a, b) => extractYears(b.experience) - extractYears(a.experience));
    }
    
    setFilteredDoctors(filtered);
  }, [searchQuery, consultMode, selectedSpecialities, sortBy]);
  
  // Function to update URL with new query parameters
  const updateQueryParams = (params) => {
    const newParams = new URLSearchParams(location.search);
    
    // Update provided parameters
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        newParams.delete(key);
        value.forEach(val => newParams.append(key, val));
      } else if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    // Update URL
    navigate({
      pathname: location.pathname,
      search: newParams.toString()
    }, { replace: true });
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() !== '') {
      const matchedDoctors = doctorsData
        .filter(doctor => doctor.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);
      setSuggestions(matchedDoctors);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Handle search suggestion click
  const handleSuggestionClick = (doctorName) => {
    setSearchQuery(doctorName);
    setShowSuggestions(false);
    updateQueryParams({ search: doctorName });
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    updateQueryParams({ search: searchQuery });
  };
  
  // Handle consultation mode change
  const handleConsultModeChange = (mode) => {
    setConsultMode(mode);
    updateQueryParams({ consultMode: mode });
  };
  
  // Handle speciality filter change
  const handleSpecialityChange = (speciality) => {
    let updatedSpecialities;
    if (selectedSpecialities.includes(speciality)) {
      updatedSpecialities = selectedSpecialities.filter(s => s !== speciality);
    } else {
      updatedSpecialities = [...selectedSpecialities, speciality];
    }
    setSelectedSpecialities(updatedSpecialities);
    updateQueryParams({ speciality: updatedSpecialities });
  };
  
  // Handle sort option change
  const handleSortChange = (option) => {
    setSortBy(option);
    updateQueryParams({ sortBy: option });
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setConsultMode('');
    setSelectedSpecialities([]);
    setSortBy('');
    navigate(location.pathname);
  };
  
  if (loading) return <p>Loading doctors...</p>;

  return (
    <div className="doctor-search-container">
      
      {/* Search Bar */}
      <header className="search-header">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search Symptoms, Doctors, Specialists, Clinics"
              value={searchQuery}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              data-testid="search-input"
              className="search-input"
            />
            <button type="submit" className="search-button" data-testid="search-button">
              <i className="search-icon">🔍</i>
            </button>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown" data-testid="suggestions-dropdown">
                {suggestions.map(doctor => (
                  <div 
                    key={doctor.id} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(doctor.name)}
                    data-testid={`suggestion-${doctor.id}`}
                  >
                    {doctor.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </header>

      <div className="main-content">
        {/* Filters Panel */}
        <aside className="filters-panel">
          {/* Sort Filter */}
          <div className="filter-section">
            <div className="filter-header">
              <h3>Sort by</h3>
              <span className="chevron">▾</span>
            </div>
            <div className="filter-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === 'fees'}
                  onChange={() => handleSortChange('fees')}
                  data-testid="sort-by-fees"
                />
                <span>Price: Low-High</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === 'experience'}
                  onChange={() => handleSortChange('experience')}
                  data-testid="sort-by-experience"
                />
                <span>Experience: Most Experience first</span>
              </label>
            </div>
          </div>

          {/* Filters Header */}
          <div className="filters-header">
            <h3>Filters</h3>
            <button 
              className="clear-all-btn" 
              onClick={clearAllFilters}
              data-testid="clear-all-button"
            >
              Clear All
            </button>
          </div>

          {/* Specialities Filter */}
          <div className="filter-section">
            <div className="filter-header">
              <h3>Specialities</h3>
              <span className="chevron">▾</span>
            </div>
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search specialities"
                className="speciality-search"
                data-testid="speciality-search"
              />
            </div>
            <div className="filter-options">
              {allSpecialities.map((speciality, index) => (
                <label key={index} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={selectedSpecialities.includes(speciality)}
                    onChange={() => handleSpecialityChange(speciality)}
                    data-testid={`speciality-${speciality.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                  <span>{speciality}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Consultation Mode Filter */}
          <div className="filter-section">
            <div className="filter-header">
              <h3>Mode of consultation</h3>
              <span className="chevron">▾</span>
            </div>
            <div className="filter-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="consultMode"
                  checked={consultMode === 'Video Consultation'}
                  onChange={() => handleConsultModeChange('Video Consultation')}
                  data-testid="video-consult"
                />
                <span>Video Consultation</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="consultMode"
                  checked={consultMode === 'In-clinic Consultation'}
                  onChange={() => handleConsultModeChange('In-clinic Consultation')}
                  data-testid="in-clinic-consult"
                />
                <span>In-clinic Consultation</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="consultMode"
                  checked={consultMode === ''}
                  onChange={() => handleConsultModeChange('')}
                  data-testid="all-consult"
                />
                <span>All</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Doctor List */}
        <main className="doctor-list">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map(doctor => (
              <div className="doctor-card" key={doctor.id} data-testid={`doctor-card-${doctor.id}`}>
                <div className="doctor-info">
                  <div className="doctor-avatar">
                    <img 
                      src={doctor.photo || `https://via.placeholder.com/80?text=${doctor.name_initials}`} 
                      alt={doctor.name} 
                    />
                  </div>
                  <div className="doctor-details">
                    <h2 className="doctor-name">{doctor.name}</h2>
                    <p className="doctor-speciality">
                      {doctor.specialities.map(spec => spec.name).join(", ")}
                    </p>
                    <p className="doctor-qualifications">
                      {doctor.doctor_introduction.split(',')[1]?.trim() || ''}
                    </p>
                    <p className="doctor-experience">{doctor.experience}</p>
                    <div className="doctor-clinic">
                      <i className="clinic-icon">🏥</i>
                      <span>{doctor.clinic.name}</span>
                    </div>
                    <div className="doctor-location">
                      <i className="location-icon">📍</i>
                      <span>{doctor.clinic.address.locality}</span>
                    </div>
                    <div className="doctor-languages">
                      <i className="language-icon">🗣️</i>
                      <span>{doctor.languages.join(", ")}</span>
                    </div>
                  </div>
                </div>
                <div className="appointment-section">
                  <div className="doctor-fees">{doctor.fees}</div>
                  <div className="consult-modes">
                    {doctor.in_clinic && (
                      <span className="consult-badge clinic">In-clinic</span>
                    )}
                    {doctor.video_consult && (
                      <span className="consult-badge video">Video</span>
                    )}
                  </div>
                  <button className="book-button" data-testid={`book-appointment-${doctor.id}`}>
                    Book Appointment
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results" data-testid="no-results">
              <p>No doctors found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DoctorSearch;