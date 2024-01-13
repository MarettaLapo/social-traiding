import React from "react"
import { NavLink } from "react-router-dom"

const Navigation = () => (
  <nav>
    <ul>
      <li>
        <NavLink exact activeClassName="active" to="/">
          Home
        </NavLink>
      </li>
      <li>
        <NavLink exact activeClassName="active" to="/investment">
          Investors
        </NavLink>
      </li>
      <li>
        <NavLink exact activeClassName="active" to="/trading">
          Traders
        </NavLink>
      </li>
    </ul>
  </nav>
)

export default Navigation
