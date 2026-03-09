import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress, useMediaQuery, useTheme, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import BarChartIcon from '@mui/icons-material/BarChart';
import CollectionsIcon from '@mui/icons-material/Collections';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InfoIcon from '@mui/icons-material/Info';
import LanguageIcon from '@mui/icons-material/Language';
import ForumIcon from '@mui/icons-material/Forum';
import LoginDialog from './LoginDialog';
import LogoMark from './Brand';

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
    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(247,242,232,0.2)', borderRadius: 1, p: 0.5, ml: 1 }}>
      <Button
        size="small"
        sx={{ minWidth: '36px', fontSize: '16px', opacity: i18n.language.startsWith('el') ? 1 : 0.45 }}
        onClick={() => changeLanguage('el')}
        aria-label="Ελληνικά"
      >
        🇬🇷
      </Button>
      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(247,242,232,0.2)', mx: 0.5 }} />
      <Button
        size="small"
        sx={{ minWidth: '36px', fontSize: '16px', opacity: i18n.language.startsWith('en') ? 1 : 0.45 }}
        onClick={() => changeLanguage('en')}
        aria-label="English"
      >
        🇬🇧
      </Button>
    </Box>
  );

  const navBtnSx = { color: 'rgba(247,242,232,0.45)', '&:hover': { color: '#F7F2E8' }, transition: 'color 180ms' };

  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Button component={RouterLink} to="/about" sx={navBtnSx}>{t('about')}</Button>
      <Button component={RouterLink} to="/stats" sx={navBtnSx}>{t('statistics')}</Button>
      <Button component={RouterLink} to="/photos" sx={navBtnSx} startIcon={<CollectionsIcon />}>{t('photos.nav')}</Button>
      <IconButton
        component="a"
        href="https://discord.gg/Kqn3UEZsGp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discord"
        sx={{ color: 'rgba(247,242,232,0.45)', '&:hover': { color: '#F7F2E8' } }}
        title={t('header.discord')}
      >
        <ForumIcon />
      </IconButton>
      {user && user.role === 'ADMIN' && (
        <Button component={RouterLink} to="/admin" sx={navBtnSx} startIcon={<AdminPanelSettingsIcon />}>
          {t('admin')}
        </Button>
      )}
      <LanguageSwitcher />
      <Box sx={{ ml: 1 }}>
        {loading ? <CircularProgress size={24} sx={{ color: '#F7F2E8' }} /> : (
          user ? (
            <IconButton onClick={handleMenuOpen}>
              <Avatar src={user.profile_picture_url} alt={user.display_name} />
            </IconButton>
          ) : (
            <Button
              variant="contained"
              onClick={handleLogin}
              startIcon={<LoginIcon />}
              sx={{ bgcolor: '#C2652A', color: '#F7F2E8', '&:hover': { bgcolor: '#A8511F' } }}
            >
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
          <Box component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LogoMark size={25} variant="dark" />
            <Typography variant="h6" sx={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 200, letterSpacing: '-0.04em', fontSize: '20px', color: '#F7F2E8' }}>
              vathr<em style={{ color: '#C2652A', fontStyle: 'italic' }}>a</em>
            </Typography>
          </Box>
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
          <MenuItem key="photos" component={RouterLink} to="/photos" onClick={handleMenuClose}>
            <ListItemIcon><CollectionsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('photos.nav')}</ListItemText>
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
          <MenuItem key="photos" component={RouterLink} to="/photos" onClick={handleMenuClose}>
            <ListItemIcon><CollectionsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{t('photos.nav')}</ListItemText>
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
            <Button size="small" onClick={() => changeLanguage('el')} disabled={i18n.language.startsWith('el')} sx={{ fontSize: '16px', minWidth: '36px' }}>🇬🇷</Button>
            <Button size="small" onClick={() => changeLanguage('en')} disabled={i18n.language.startsWith('en')} sx={{ fontSize: '16px', minWidth: '36px' }}>🇬🇧</Button>
          </Box>
        </MenuItem>
      </Menu>
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
};
export default Header;
