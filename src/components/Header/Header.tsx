import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Menu, X } from 'lucide-react';
import './Header.scss';
import logo from '../../assets/logo.png'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <Link to="/" className="header__logo-link">
            {/* <BarChart2 size={24} color="#fff" /> */}
            <img src={logo} alt="" />
            <span className="header__title">KDU Stock Market</span>
          </Link>
        </div>
        
        <div className="header__nav-desktop">
          <Link to="/summarizer" className="header__nav-link">Summarizer</Link>
          <Link to="/portfolio" className="header__nav-link">My Portfolio</Link>
        </div>
        
        <div className="header__mobile-menu">
          <button className="header__menu-button" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} color="#fff" /> : <Menu size={24} color="#fff" />}
          </button>
        </div>
      </div>
      
      {isMenuOpen && (
        <div className="header__mobile-dropdown">
          <Link to="/summarizer" className="header__mobile-link" onClick={toggleMenu}>
            Summarizer
          </Link>
          <Link to="/portfolio" className="header__mobile-link" onClick={toggleMenu}>
            My Portfolio
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;