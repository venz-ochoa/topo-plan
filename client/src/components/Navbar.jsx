//this is for the navbar (add one NavLink for every page you create)
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="brand">
        <img src="/icons/logo.svg" alt="logo" className="logo" />
        <span>My Template</span>
      </NavLink>
      <div className="links">
        <NavLink to="/">Home</NavLink>
        {/*this is for the example page link (delete this and add your own links)*/}
        <NavLink to="/example">Example</NavLink>
      </div>
    </nav>
  );
}
