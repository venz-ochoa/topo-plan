//this is for the app routes (add one route for every page you create)
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';

//this is for the app layout (navbar on top, pages below)
export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          {/*this is for the home page*/}
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </>
  );
}
