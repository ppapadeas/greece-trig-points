import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import './index.css';
import './i18n';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

Sentry.init({
  dsn: 'https://3f230483007cef545ff6da6027a99687@o4511014582747136.ingest.us.sentry.io/4511014584320000',
  environment: import.meta.env.MODE,
  release: typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : undefined,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#C2652A',       // terracotta
      dark: '#A8511F',
      contrastText: '#F7F2E8',
    },
    secondary: {
      main: '#4A5568',       // slate
    },
    background: {
      default: '#F7F2E8',    // parchment
      paper: '#EDE4D3',      // limestone
    },
    text: {
      primary: '#1C1A14',    // ink
      secondary: '#4A5568',  // slate
    },
    divider: 'rgba(28,26,20,0.12)',
  },
  typography: {
    fontFamily: "'Noto Serif', Georgia, serif",
    h1: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 200, letterSpacing: '-0.04em' },
    h2: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 200, letterSpacing: '-0.04em' },
    h3: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 200, letterSpacing: '-0.04em' },
    h4: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 200, letterSpacing: '-0.04em' },
    h5: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 200, letterSpacing: '-0.04em' },
    h6: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 200, letterSpacing: '-0.04em' },
    button: { fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.75rem' },
    caption: { fontFamily: "'IBM Plex Mono', 'Courier New', monospace", fontSize: '0.7rem' },
    overline: { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#1C1A14' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
);