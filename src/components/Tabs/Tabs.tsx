import React from 'react';
import './Tabs.scss';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="tabs">
      <button 
        className={`tabs__button ${activeTab === 'explore' ? 'tabs__button--active' : ''}`}
        onClick={() => onTabChange('explore')}
      >
        Explore
      </button>
      <button 
        className={`tabs__button ${activeTab === 'watchlist' ? 'tabs__button--active' : ''}`}
        onClick={() => onTabChange('watchlist')}
      >
        My Watchlist
      </button>
    </div>
  );
};

export default Tabs;