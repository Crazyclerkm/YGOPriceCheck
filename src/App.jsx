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

  //const [results, setResults] = useState([]);
  //const [pageIndex, setPageIndex] = useState(0);

  /*useEffect(() => {
    let ignore = false;
    fetchResults(searchQuery, pageIndex).then(json => {
      if (!ignore) {
        setResults(json);
      }
    });
    return () => {
      ignore = true;
    };
  }, [searchQuery, pageIndex, sortOption]);*/

  /*const sentinalRef = useRef(null);

  async function updateSearchQuery(newQuery) {
    setSearchQuery(newQuery);
    setPageIndex(0);

    const initialResults = await fetchResults(newQuery, 0);
    setResults(initialResults);
  }

  async function loadMoreResults() {
    setPageIndex(prev => prev+1);
    const newItems = fetchResults(searchQuery, pageIndex);
    setResults(prev => [...prev, ...newItems]);
  };*/

  /*async function fetchResults(query, index, count=12) {
      try {
        let response = null;
        if(query !== '') {
          response = await fetch(`http://localhost/test/search.php?name=${query}&index=${index}&count=${count}`, {credentials: 'include'});
        } else {
          response = await fetch(`http://localhost/test/search.php?index=${index}&count=${count}` , {credentials: 'include'});
        }

        const data = await response.json();
        //setResults(data);
        return data;
      } catch (error) {
        
      }
  };*/

  /*useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreResults();
      }
    }, {threshold: 1.0});
    //observer.observe();
  });*/

  /*useEffect(() => {
    fetchResults(searchQuery);
  }, [searchQuery, sortOption]);*/

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