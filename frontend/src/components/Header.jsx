import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext";

// Material UI components
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  ListItemIcon,
  Tooltip,
  Badge,
  Container,
  SwipeableDrawer,
  Divider,
} from "@mui/material";

// Material UI icons
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  PersonAdd as PersonAddIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Help as HelpIcon,
} from "@mui/icons-material";

// Import keyframes for animations
import { keyframes } from "@emotion/react";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Header = ({ darkMode, toggleDarkMode }) => {
  const { isAuthenticated, currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  useEffect(() => {
    // Update breadcrumb path when location changes
    setCurrentPath(location.pathname);
  }, [location]);

  const isDark = theme.palette.mode === 'dark';
  const modernColors = {
    primary: "#0ea5e9",
    secondary: "#10b981",
    accent: "#f59e0b",
    dark: theme.palette.background.paper,
    light: theme.palette.background.default,
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
    glassBackground: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
  };

  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/');
  };

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  // Get path name for breadcrumbs
  const getBreadcrumbName = (path) => {
    switch(path) {
      case '/': return 'Home';
      case '/auth': return 'Authentication';
      case '/dashboard': return 'Dashboard';
      case '/face-authentication': return 'Face Authentication';
      case '/profile': return 'Profile';
      case '/admin': return 'Admin';
      case '/admin-login': return 'Admin Login';
      case '/qr-verification': return 'QR Verification';
      case '/team': return 'Team';
      default: return path.replace('/', '').split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const navigationItems = [
    { label: "Home", path: "/", icon: <HomeIcon /> },
    ...(isAuthenticated ? [
      { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    ] : []),
    { label: darkMode ? "Light Mode" : "Dark Mode",
      action: toggleDarkMode,
      icon: darkMode ? <LightModeIcon /> : <DarkModeIcon /> },
  ];

  const mobileDrawerContent = (
    <Box sx={{ 
      width: 280, 
      pt: 2,
      height: '100%',
      backgroundColor: darkMode ? modernColors.dark : modernColors.light,
      color: modernColors.textPrimary
    }}>
      <List>
        {navigationItems.map((item) => (
          <ListItem 
            button 
            key={item.label} 
            component={item.action ? 'div' : Link} 
            to={item.action ? undefined : item.path}
            onClick={item.action || (() => setMobileDrawerOpen(false))}
            sx={{
              borderRadius: '12px',
              mx: 1,
              my: 0.5,
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
              }
            }}
          >
            <Box sx={{ mr: 2, color: modernColors.primary }}>
              {item.icon}
            </Box>
            <ListItemText 
              primary={item.label} 
              sx={{ 
                '& .MuiListItemText-primary': {
                  fontWeight: 600,
                  color: modernColors.textPrimary
                }
              }}
            />
          </ListItem>
        ))}
        
        <Divider sx={{ my: 2, borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        
        {/* Admin section in mobile drawer */}
        <ListItem 
          button 
          component={Link}
          to="/admin-login"
          onClick={() => setMobileDrawerOpen(false)}
          sx={{
            borderRadius: '12px',
            mx: 1,
            my: 0.5,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
            }
          }}
        >
          <Box sx={{ mr: 2, color: modernColors.primary }}>
            <AdminPanelSettingsIcon />
          </Box>
          <ListItemText 
            primary="Admin" 
            sx={{ 
              '& .MuiListItemText-primary': {
                fontWeight: 600,
                color: modernColors.primary
              }
            }}
          />
        </ListItem>
        
        {/* Authentication section in mobile drawer */}
        {isAuthenticated && (
          <>
            <Divider sx={{ my: 2, borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            <Box sx={{ mx: 2, my: 2, p: 2, backgroundColor: modernColors.light, borderRadius: '12px' }}>
              <Typography variant="body2" sx={{ color: modernColors.textSecondary, mb: 1 }}>
                Signed in as
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: modernColors.textPrimary }}>
                {currentUser?.username}
              </Typography>
            </Box>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                borderRadius: '12px',
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                }
              }}
            >
              <Box sx={{ mr: 2, color: '#ef4444' }}>
                <LogoutIcon />
              </Box>
              <ListItemText 
                primary="Logout" 
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: '#ef4444'
                  }
                }}
              />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          background: 'transparent',
          boxShadow: 'none',
          pt: { xs: 2, md: 3 },
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            sx={{
              minHeight: 'auto',
              py: 0,
              px: 0,
              alignItems: 'stretch',
            }}
          >
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: { xs: 1, sm: 2, md: 3 },
                py: { xs: 1, sm: 1.5, md: 2 },
                borderRadius: { xs: '18px', md: '24px' },
                boxShadow: darkMode
                  ? '0 12px 40px rgba(0, 0, 0, 0.35)'
                  : '0 24px 60px rgba(14, 165, 233, 0.12)',
                background: darkMode
                  ? 'linear-gradient(160deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 64, 175, 0.28) 100%)'
                  : 'linear-gradient(160deg, rgba(248, 250, 252, 0.92) 0%, rgba(224, 242, 254, 0.78) 100%)',
                backdropFilter: 'blur(18px)',
                border: darkMode
                  ? '1px solid rgba(148, 163, 184, 0.25)'
                  : '1px solid rgba(14, 165, 233, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: { xs: '18px', md: '24px' },
                  padding: '1px',
                  background: modernColors.gradient,
                  WebkitMask:
                    'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  opacity: 0.6,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexGrow: { xs: 1, md: 0 },
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {isMobile && (
                  <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={handleMobileDrawerToggle}
                    sx={{
                      mr: 0.5,
                      color: modernColors.textPrimary,
                      backgroundColor: darkMode ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.18)',
                      borderRadius: '14px',
                      width: 42,
                      height: 42,
                      '&:hover': {
                        backgroundColor: 'rgba(148, 163, 184, 0.22)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}

                <Box
                  component={Link}
                  to="/"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    textDecoration: 'none',
                    color: 'inherit',
                    px: { xs: 1, md: 1.5 },
                    py: 0.5,
                    borderRadius: '16px',
                    background: modernColors.glassBackground,
                    border: darkMode
                      ? '1px solid rgba(148, 163, 184, 0.28)'
                      : '1px solid rgba(14, 165, 233, 0.25)',
                    boxShadow: darkMode
                      ? 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                      : 'inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                    transition: 'transform 0.2s ease, background 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      background: darkMode
                        ? 'linear-gradient(120deg, rgba(14, 165, 233, 0.2), rgba(16, 185, 129, 0.2))'
                        : 'linear-gradient(120deg, rgba(14, 165, 233, 0.18), rgba(16, 185, 129, 0.18))',
                    },
                  }}
                >
                  {/* === MODIFICATION START === */}
                  <Box
                    component="img"
                    src="/images/logo.png" // Your image path from the public folder
                    alt="Logo"
                    sx={{
                      width: 42,
                      height: 42,
                      objectFit: 'cover', // Ensures the image covers the area without distortion
                    }}
                  />
                  {/* === MODIFICATION END === */}

                  <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fontSize: '0.6rem',
                        color: darkMode ? 'rgba(226, 232, 240, 0.75)' : 'rgba(30, 41, 59, 0.75)',
                      }}
                    >
                      Secure Digital
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        background: modernColors.gradient,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: { xs: '1.15rem', sm: '1.3rem', md: '1.45rem' },
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Wallet
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Desktop Navigation */}
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  alignItems: 'center',
                  gap: 1.5,
                  ml: 'auto',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: '20px',
                  background: darkMode
                    ? 'rgba(15, 23, 42, 0.6)'
                    : 'rgba(248, 250, 252, 0.65)',
                  backdropFilter: 'blur(12px)',
                  border: darkMode
                    ? '1px solid rgba(148, 163, 184, 0.2)'
                    : '1px solid rgba(148, 163, 184, 0.28)',
                  boxShadow: darkMode
                    ? '0 12px 40px rgba(15, 23, 42, 0.35)'
                    : '0 18px 45px rgba(14, 165, 233, 0.16)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -14,
                    background: 'radial-gradient(circle at top, rgba(14, 165, 233, 0.32), transparent 60%)',
                    zIndex: -1,
                    filter: 'blur(15px)',
                  }}
                />
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                component={item.action ? 'button' : Link}
                to={item.action ? undefined : item.path}
                onClick={item.action || undefined}
                startIcon={item.icon}
                sx={{
                  color: modernColors.textPrimary,
                  fontWeight: 600,
                  textTransform: "none",
                  px: 2,
                  py: 1.5,
                  borderRadius: '12px',
                  position: 'relative',
                  fontSize: '0.95rem',
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                  '&::after': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    bottom: 6,
                    height: 3,
                    borderRadius: 2,
                    background: modernColors.primary,
                    opacity: 0,
                    transform: 'scaleX(0)',
                    transition: 'all 0.25s',
                  },
                  '&:hover::after': {
                    opacity: 1,
                    transform: 'scaleX(1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label}
              </Button>
            ))}
            
            <Button
              component={Link}
              to="/admin-login"
              startIcon={<AdminPanelSettingsIcon />}
              sx={{
                color: modernColors.primary,
                fontWeight: 600,
                textTransform: "none",
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Admin
            </Button>

            {/* Authentication Button/Menu */}
            {isAuthenticated && (
              <Button
                onClick={handleUserMenuClick}
                startIcon={
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    background: modernColors.gradient,
                    fontSize: '14px',
                    fontWeight: 600
                  }}>
                    {currentUser?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                }
                sx={{
                  ml: 2, 
                  color: modernColors.textPrimary,
                  fontWeight: 600,
                  textTransform: "none",
                  px: 2,
                  py: 1.5,
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  whiteSpace: 'nowrap',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Hello, {currentUser?.username}
              </Button>
            )}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                  border: `1px solid rgba(99, 102, 241, 0.1)`,
                  minWidth: 200,
                }
              }}
            >
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  }
                }}
              >
                <LogoutIcon sx={{ mr: 2, color: '#ef4444' }} />
                <Typography sx={{ color: '#ef4444', fontWeight: 600 }}>
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </Box>

          {/* This Box seems redundant and was causing a layout issue, it's removed for clarity */}
          {/* A hamburger menu icon is already rendered conditionally for mobile at the top */}
        </Box>
      </Toolbar>
    </Container>
  </AppBar>

      {/* Mobile Drawer */}
      <SwipeableDrawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={handleMobileDrawerToggle}
        onOpen={handleMobileDrawerToggle}
        PaperProps={{
          sx: {
            backgroundColor: modernColors.glassBackground,
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        {mobileDrawerContent}
      </SwipeableDrawer>
    </>
  );
};

export default Header;