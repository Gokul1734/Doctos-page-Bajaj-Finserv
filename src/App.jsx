import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DoctorSearch from './Pages/DoctorSearch';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DoctorSearch />} />
      </Routes>
    </Router>
  );
}

export default App;