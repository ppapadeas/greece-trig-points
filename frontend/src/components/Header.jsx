import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress, useMediaQuery, useTheme, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InfoIcon from '@mui/icons-material/Info';
import LanguageIcon from '@mui/icons-material/Language';
import ForumIcon from '@mui/icons-material/Forum';
import LoginDialog from './LoginDialog';

const Header = () => {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const isMenuOpen = Boolean(anchorEl);

  const handleLogin = () => {
    handleMenuClose();
    setLoginOpen(true);
  };

  const handleLogout = () => {
    handleMenuClose();
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/logout`;
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    handleMenuClose();
  };

  const LanguageSwitcher = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 1, p: 0.5, ml: 1 }}>
      <Button
        size="small"
        sx={{ color: 'white', fontWeight: i18n.language.startsWith('el') ? 'bold' : 'normal', minWidth: '40px' }}
        onClick={() => changeLanguage('el')}
      >
        ΕΛ
      </Button>
      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 0.5 }} />
      <Button
        size="small"
        sx={{ color: 'white', fontWeight: i18n.language.startsWith('en') ? 'bold' : 'normal', minWidth: '40px' }}
        onClick={() => changeLanguage('en')}
      >
        EN
      </Button>
    </Box>
  );

  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button component={RouterLink} to="/about" color="inherit">{t('about')}</Button>
      <Button component={RouterLink} to="/stats" color="inherit">{t('statistics')}</Button>
      <IconButton
        component="a"
        href="https://discord.gg/Kqn3UEZsGp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discord"
        sx={{ color: 'white' }}
        title={t('header.discord')}
      >
        <ForumIcon />
      </IconButton>
      {user && user.role === 'ADMIN' && (
        <Button component={RouterLink} to="/admin" color="inherit" startIcon={<AdminPanelSettingsIcon />}>
          {t('admin')}
        </Button>
      )}
      <LanguageSwitcher />
      <Box sx={{ ml: 1 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : (
          user ? (
            <IconButton onClick={handleMenuOpen}>
              <Avatar src={user.profile_picture_url} alt={user.display_name} />
            </IconButton>
          ) : (
            <Button color="inherit" variant="outlined" onClick={handleLogin} startIcon={<LoginIcon />}>
              {t('login')}
            </Button>
          )
        )}
      </Box>
    </Box>
  );

  const renderMobileMenu = () => (
    <IconButton color="inherit" aria-label="open menu" edge="end" onClick={handleMenuOpen}>
      <MenuIcon />
    </IconButton>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            {t('appName')}
          </Typography>
          {isMobile ? renderMobileMenu() : renderDesktopMenu()}
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {user ? [
          <MenuItem key="profile" component={RouterLink} to={`/profile/${user.id}`} onClick={handleMenuClose}>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('profile')}</ListItemText>
          </MenuItem>,
          <Divider key="divider1" />,
          user.role === 'ADMIN' && (
            <MenuItem key="admin" component={RouterLink} to="/admin" onClick={handleMenuClose}>
              <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>{t('admin')}</ListItemText>
            </MenuItem>
          ),
          <MenuItem key="about" component={RouterLink} to="/about" onClick={handleMenuClose}>
            <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('about')}</ListItemText>
          </MenuItem>,
          <MenuItem key="stats" component={RouterLink} to="/stats" onClick={handleMenuClose}>
            <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('statistics')}</ListItemText>
          </MenuItem>,
          <Divider key="divider2" />,
          <MenuItem key="logout" onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('logout')}</ListItemText>
          </MenuItem>
        ] : [
          <MenuItem key="about" component={RouterLink} to="/about" onClick={handleMenuClose}>
            <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('about')}</ListItemText>
          </MenuItem>,
          <MenuItem key="stats" component={RouterLink} to="/stats" onClick={handleMenuClose}>
            <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('statistics')}</ListItemText>
          </MenuItem>,
          <MenuItem key="login" onClick={handleLogin}>
            <ListItemIcon><LoginIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('login')}</ListItemText>
          </MenuItem>
        ]}
        <Divider />
        <MenuItem component="a" href="https://discord.gg/Kqn3UEZsGp" target="_blank" rel="noopener noreferrer" onClick={handleMenuClose}>
          <ListItemIcon><ForumIcon fontSize="small" sx={{ color: '#5865F2' }} /></ListItemIcon>
          <ListItemText>{t('header.discord')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemIcon><LanguageIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Language</ListItemText>
          <Box sx={{ ml: 2 }}>
            <Button size="small" onClick={() => changeLanguage('el')} disabled={i18n.language.startsWith('el')}>ΕΛ</Button>
            <Button size="small" onClick={() => changeLanguage('en')} disabled={i18n.language.startsWith('en')}>EN</Button>
          </Box>
        </MenuItem>
      </Menu>
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};
export default Header;
