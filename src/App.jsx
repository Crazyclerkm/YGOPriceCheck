import {useEffect, useState, useRef} from 'react';
import './App.css';
import MenuBar from './components/MenuBar.jsx';
import SearchContent from './components/SearchContent.jsx';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState(() => {
    const savedSort = getCookie('Sort');
    return savedSort ? decodeURIComponent(savedSort) : 'Name';
  });

  function handleSortChange(newSort) {
    setSortOption(newSort);
    setCookie('Sort', newSort);
  }

  return (
    <>
      <MenuBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOption={sortOption}
        setSortOption={handleSortChange}
      />
      <SearchContent 
        searchQuery={searchQuery}
        sortOption={sortOption}
      />
    </>
  )
}

function setCookie(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=None; Secure`;
}

function getCookie(name) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}

export default App;