import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
    palette: {
        primary: {
            main: 'rgb(196, 195, 195)',
        },
        secondary: {
            main: 'rgb(184, 30, 30)',
        },
        mode: 'light',
    },
});
