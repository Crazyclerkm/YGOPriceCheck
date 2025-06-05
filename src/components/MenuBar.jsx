import SearchBox from './SearchBox.jsx';
import SettingsIcon from '@mui/icons-material/Settings';
import FavoriteIcon from '@mui/icons-material/Favorite';
import {AppBar, Box, IconButton, Toolbar} from '@mui/material';

function MenuBar({ searchQuery, setSearchQuery, sortOption, setSortOption }) {
    return (
        <Box sx={{ width: '100%', flexGrow: 1}}>
            <AppBar position="fixed" sx={{padding: '0.6em'}}>
            <Toolbar sx={{justifyContent: 'space-between'}}>
                <IconButton size='large'>
                    <FavoriteIcon sx={{ fontSize: 40 }}/>
                </IconButton>
                <SearchBox
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
                />

                <IconButton>
                    <SettingsIcon sx={{ fontSize: 40 }}/>
                </IconButton>
            </Toolbar>
            </AppBar>
        </Box>
    );
}

export default MenuBar;