//this is for the navbar (add one NavLink for every page you create)
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">
        <span>TopoPlan</span>
      </NavLink>
      <div className="links">
        <NavLink to="/">Home</NavLink>
      </div>
    </nav>
  );
}
