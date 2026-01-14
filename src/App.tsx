import { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useParams, Link } from 'react-router-dom'
import './App.css'
import MapApp from './MapApp'
import AutoTracking from './AutoTracking'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapApp></MapApp>} />
        <Route path="/map" element={<MapApp></MapApp>} />
        <Route path="/tracking" element={<AutoTracking></AutoTracking>} />
      </Routes>
    </Router>
    
  )
}

export default App
