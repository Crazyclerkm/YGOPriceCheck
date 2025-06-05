import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import { styled, alpha } from '@mui/material/styles';
import { Select, MenuItem, FormControl } from '@mui/material';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingRight: `calc(1em + 12ch)`, // match width of Select
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const SearchSortSelectWrapper = styled('div')(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  border: 'none',
  borderLeft: '1px solid black',
  borderRadius: 0,
}));

function SearchBox({ searchQuery, setSearchQuery, sortOption, setSortOption }) {
    return (
        <Search>
            <SearchIconWrapper>
                <SearchIcon/>
            </SearchIconWrapper>
            <StyledInputBase
              value={searchQuery}
              placeholder="Search…"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchSortSelectWrapper>
                <FormControl variant="standard" sx={{ width: '12ch'}}>
                    <Select
                        labelId="sort-label"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                        label="Sort By"
                        size='small'
                        disableUnderline
                    >
                        <MenuItem value="Name">Name</MenuItem>
                        <MenuItem value="Price asc">Price ↑</MenuItem>
                        <MenuItem value="Price desc">Price ↓</MenuItem>
                        <MenuItem value="Vendor">Vendor</MenuItem>   
                    </Select>
                </FormControl>
            </SearchSortSelectWrapper>
            
        </Search>  
    );
}

export default SearchBox;