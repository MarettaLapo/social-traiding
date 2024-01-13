import React from "react"
import {Routes, Route } from 'react-router-dom';
import Navigation from "./component/layout/Havigation"
import Investors from "./component/page/Investors"
import Traders from "./component/page/Traders"
import Home from "./component/page/Home"
import "./styles.css"

const App = () => (
  <div className="App">
    <Navigation />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/investment" element={<Investors/>} />
      <Route path="/trading" element={<Traders />} />
    </Routes>
  </div>
)

export default App
