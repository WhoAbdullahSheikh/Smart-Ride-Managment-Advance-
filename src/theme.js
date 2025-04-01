import { createTheme } from "@mui/material/styles";

export const getTheme = (darkMode) => {
  return createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#90caf9" : "#1976d2",
      },
      secondary: {
        main: darkMode ? "#f48fb1" : "#d81b60",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#1e1e1e" : "#ffffff",
      },
    },
    typography: {
      fontFamily: "Raleway, sans-serif",
    },
  });
};