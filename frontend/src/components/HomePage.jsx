import React, { useState, useEffect, useContext } from "react";

import {
  Typography,
  Button,
  useMediaQuery,
  useTheme,
  Box,
  Grid,
  Container,
  Card,
  CardContent,
  Chip,
  Avatar,
  Stack,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  VerifiedUser as VerifiedUserIcon,
  Lock as LockIcon,
  Fingerprint as FingerprintIcon,
  QrCode2 as QrCodeIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from './AuthContext';
import WalletModel3D from './WalletModel3D';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isLoaded, setIsLoaded] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleGetStartedClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  const isDark = theme.palette.mode === 'dark';
  const colors = {
    primary: "#0ea5e9",
    secondary: "#10b981",
    accent: "#f59e0b",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    background: theme.palette.background.default,
    surface: theme.palette.background.paper,
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
  };

  const gradients = {
    primary: "linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)",
    secondary: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
    accent: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    glass: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
  };

  const animations = {
    fadeInUp: {
      initial: { opacity: 0, y: 60 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, ease: "easeOut" }
    },
    staggerContainer: {
      animate: {
        transition: {
          staggerChildren: 0.1
        }
      }
    },
    staggerItem: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: "easeOut" }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const challenges = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: "Identity Crisis",
      description: "2.5 billion people worldwide lack official identification, creating barriers to essential services.",
      color: colors.error,
      bgColor: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
    },
    {
      icon: <ShieldIcon sx={{ fontSize: 40 }} />,
      title: "Data Vulnerabilities",
      description: "Centralized systems are prone to breaches, corruption, and single points of failure.",
      color: colors.warning,
      bgColor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)",
    },
    {
      icon: <LockIcon sx={{ fontSize: 40 }} />,
      title: "Privacy Erosion",
      description: "Users lose control over their personal data in traditional verification systems.",
      color: colors.primary,
      bgColor: isDark ? "rgba(14, 165, 233, 0.15)" : "rgba(14, 165, 233, 0.1)",
    },
  ];

  const features = [
    {
      icon: <FingerprintIcon sx={{ fontSize: 48 }} />,
      title: "Self-Sovereign Identity",
      description: "Take complete control of your digital identity. Own your data, choose what to share, and maintain privacy.",
      benefits: ["Decentralized wallets", "User-controlled data", "Privacy by design"],
    },
    {
      icon: <VerifiedUserIcon sx={{ fontSize: 48 }} />,
      title: "Zero-Knowledge Proofs",
      description: "Prove eligibility without revealing sensitive information. Verify age, qualifications, or credentials securely.",
      benefits: ["Privacy-preserving", "Cryptographically secure", "Minimal data exposure"],
    },
    {
      icon: <QrCodeIcon sx={{ fontSize: 48 }} />,
      title: "Instant Verification",
      description: "Generate QR codes for instant, tamper-proof verification across all platforms and services.",
      benefits: ["Real-time validation", "Blockchain-anchored", "Cross-platform compatible"],
    },
  ];

  const workflow = [
    {
      step: "01",
      title: "Upload & Verify",
      description: "Securely upload your documents with advanced OCR and AI-powered verification.",
      icon: <CheckCircleIcon sx={{ fontSize: 32 }} />,
    },
    {
      step: "02",
      title: "Store Safely",
      description: "Your encrypted documents are stored on decentralized IPFS with military-grade security.",
      icon: <ShieldIcon sx={{ fontSize: 32 }} />,
    },
    {
      step: "03",
      title: "Generate Proofs",
      description: "Create zero-knowledge proofs and QR codes for seamless verification anywhere.",
      icon: <QrCodeIcon sx={{ fontSize: 32 }} />,
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: colors.background }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: "100vh",
          position: "relative",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: isDark 
            ? `radial-gradient(ellipse 80% 50% at 50% -20%, ${colors.primary}20, transparent),
               radial-gradient(ellipse 80% 50% at 80% 50%, ${colors.secondary}15, transparent),
               radial-gradient(ellipse 100% 100% at 100% 100%, ${colors.accent}10, transparent)`
            : `radial-gradient(ellipse 80% 50% at 50% -20%, ${colors.primary}15, transparent),
               radial-gradient(ellipse 80% 50% at 80% 50%, ${colors.secondary}10, transparent),
               radial-gradient(ellipse 100% 100% at 100% 100%, ${colors.accent}05, transparent)`,
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            zIndex: 0,
          }}
        >
          {[...Array(20)].map((_, i) => (
            <Box
              key={i}
              sx={{
                position: "absolute",
                width: Math.random() * 200 + 50,
                height: Math.random() * 200 + 50,
                background: isDark 
                  ? `radial-gradient(circle, ${colors.primary}15, transparent)`
                  : `radial-gradient(circle, ${colors.primary}10, transparent)`,
                borderRadius: "50%",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
                "@keyframes float": {
                  "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
                  "50%": { transform: "translateY(-20px) rotate(180deg)" },
                },
              }}
            />
          ))}
        </Box>

        <Container
          maxWidth="lg"
          sx={{
            position: "relative",
            zIndex: 2,
            py: { xs: 6, md: 8 },
            px: { xs: 3, sm: 4, md: 6 },
          }}
        >
          <Grid container spacing={4} alignItems="center">
            {/* Left side - Text content */}
            <Grid item xs={12} md={6}>
              <motion.div {...animations.fadeInUp}>
                {/* Hero Header */}
                <Box sx={{ textAlign: { xs: "center", md: "left" }, mb: { xs: 6, md: 0 } }}>
                  <Chip
                    label="Revolutionary Digital Identity"
                    sx={{
                      mb: 3,
                      background: gradients.primary,
                      color: "white",
                      fontWeight: 600,
                      px: 3,
                      py: 2.5,
                      fontSize: "1rem",
                      borderRadius: "50px",
                      boxShadow: isDark 
                        ? "0 8px 32px rgba(14, 165, 233, 0.3)"
                        : "0 8px 32px rgba(14, 165, 233, 0.2)",
                    }}
                  />

                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: { xs: "2.5rem", md: "4.5rem" },
                      fontWeight: 900,
                      mb: 4,
                      background: gradients.primary,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      lineHeight: 1.1,
                    }}
                  >
                    Your Identity,
                    <br />
                    Your Control
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      color: colors.textSecondary,
                      mb: 6,
                      fontSize: { xs: "1.1rem", md: "1.3rem" },
                      lineHeight: 1.6,
                    }}
                  >
                    Experience true digital sovereignty with blockchain-powered identity verification.
                    Secure, private, and completely decentralized.
                  </Typography>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={3}
                    justifyContent={{ xs: "center", md: "flex-start" }}
                    sx={{ mb: 4 }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForwardIcon />}
                      onClick={handleGetStartedClick}
                      sx={{
                        px: 6,
                        py: 2.5,
                        background: gradients.primary,
                        borderRadius: "50px",
                        fontSize: "1.1rem",
                        fontWeight: 600,
                        textTransform: "none",
                        boxShadow: isDark 
                          ? "0 8px 32px rgba(14, 165, 233, 0.4)"
                          : "0 8px 32px rgba(14, 165, 233, 0.3)",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: isDark 
                            ? "0 12px 40px rgba(14, 165, 233, 0.5)"
                            : "0 12px 40px rgba(14, 165, 233, 0.4)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Get Started Free
                    </Button>
                  </Stack>
                </Box>
              </motion.div>
            </Grid>

            {/* Right side - 3D Model */}
            <Grid item xs={12} md={6}>
              <motion.div {...animations.scaleIn}>
                <Box
                  sx={{
                    height: { xs: "400px", md: "600px" },
                    width: "100%",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <React.Suspense fallback={
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading 3D Model...
                      </Typography>
                    </Box>
                  }>
                    <WalletModel3D />
                  </React.Suspense>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Problem Statement Section */}
      <Box sx={{ py: { xs: 8, md: 16 }, backgroundColor: colors.surface }}>
        <Container maxWidth="lg">
          <motion.div {...animations.fadeInUp}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  fontWeight: 800,
                  mb: 4,
                  color: colors.textPrimary,
                }}
              >
                The Problem We Solve
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: colors.textSecondary,
                  maxWidth: "700px",
                  mx: "auto",
                  fontSize: { xs: "1.1rem", md: "1.3rem" },
                }}
              >
                Traditional identity systems are broken. We're building the future.
              </Typography>
            </Box>
          </motion.div>

          <motion.div {...animations.staggerContainer}>
            <Grid container spacing={4}>
              {challenges.map((challenge, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div {...animations.staggerItem}>
                    <Card
                      sx={{
                        p: 4,
                        height: "100%",
                        background: colors.surface,
                        borderRadius: "24px",
                        border: `2px solid ${challenge.color}20`,
                        boxShadow: isDark 
                          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                          : "0 8px 32px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: isDark 
                            ? `0 16px 48px ${challenge.color}30`
                            : `0 16px 48px ${challenge.color}20`,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: "20px",
                          background: challenge.bgColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 3,
                          color: challenge.color,
                        }}
                      >
                        {challenge.icon}
                      </Box>

                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: colors.textPrimary,
                        }}
                      >
                        {challenge.title}
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{
                          color: colors.textSecondary,
                          lineHeight: 1.7,
                        }}
                      >
                        {challenge.description}
                      </Typography>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 16 }, backgroundColor: colors.background }}>
        <Container maxWidth="lg">
          <motion.div {...animations.fadeInUp}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  fontWeight: 800,
                  mb: 4,
                  color: colors.textPrimary,
                }}
              >
                Powerful Features
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: colors.textSecondary,
                  maxWidth: "700px",
                  mx: "auto",
                  fontSize: { xs: "1.1rem", md: "1.3rem" },
                }}
              >
                Built on cutting-edge technology for maximum security and privacy.
              </Typography>
            </Box>
          </motion.div>

          <motion.div {...animations.staggerContainer}>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div {...animations.staggerItem}>
                    <Card
                      sx={{
                        p: 4,
                        height: "100%",
                        background: colors.surface,
                        borderRadius: "24px",
                        boxShadow: isDark 
                          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                          : "0 8px 32px rgba(0, 0, 0, 0.08)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-8px)",
                          boxShadow: isDark 
                            ? "0 16px 48px rgba(14, 165, 233, 0.3)"
                            : "0 16px 48px rgba(14, 165, 233, 0.15)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          color: colors.primary,
                          mb: 3,
                        }}
                      >
                        {feature.icon}
                      </Box>

                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          mb: 2,
                          color: colors.textPrimary,
                        }}
                      >
                        {feature.title}
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{
                          color: colors.textSecondary,
                          mb: 3,
                          lineHeight: 1.7,
                        }}
                      >
                        {feature.description}
                      </Typography>

                      <Stack spacing={1.5}>
                        {feature.benefits.map((benefit, idx) => (
                          <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <CheckCircleIcon sx={{ color: colors.success, fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                              {benefit}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* Workflow Section */}
      <Box sx={{ py: { xs: 8, md: 16 }, backgroundColor: colors.surface }}>
        <Container maxWidth="lg">
          <motion.div {...animations.fadeInUp}>
            <Box sx={{ textAlign: "center", mb: 8 }}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "2.5rem", md: "4rem" },
                  fontWeight: 800,
                  mb: 4,
                  color: colors.textPrimary,
                }}
              >
                How It Works
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: colors.textSecondary,
                  maxWidth: "700px",
                  mx: "auto",
                  fontSize: { xs: "1.1rem", md: "1.3rem" },
                }}
              >
                Three simple steps to secure, verifiable digital identity.
              </Typography>
            </Box>
          </motion.div>

         <motion.div {...animations.staggerContainer}>
           <Grid container spacing={4}>
             {workflow.map((step, index) => (
               <Grid item xs={12} md={4} key={index}>
                 <motion.div {...animations.staggerItem}>
                   <Card
                     sx={{
                       p: 4,
                       textAlign: "center",
                       background: colors.surface,
                       borderRadius: "24px",
                       boxShadow: isDark 
                         ? "0 8px 32px rgba(0, 0, 0, 0.3)"
                         : "0 8px 32px rgba(0, 0, 0, 0.08)",
                       position: "relative",
                       overflow: "hidden",
                       transition: "all 0.3s ease",
                       "&:hover": {
                         transform: "translateY(-8px)",
                         boxShadow: isDark 
                           ? "0 16px 48px rgba(14, 165, 233, 0.3)"
                           : "0 16px 48px rgba(14, 165, 233, 0.15)",
                       },
                       "&::before": {
                         content: '""',
                         position: "absolute",
                         top: 0,
                         left: 0,
                         right: 0,
                         height: "4px",
                         background: gradients.primary,
                       },
                     }}
                   >
                     <Typography
                       variant="h3"
                       sx={{
                         fontSize: "4rem",
                         fontWeight: 900,
                         color: colors.primary,
                         opacity: 0.1,
                         position: "absolute",
                         top: 20,
                         right: 20,
                       }}
                     >
                       {step.step}
                     </Typography>

                     <Box sx={{ color: colors.primary, mb: 3, fontSize: "3rem" }}>
                       {step.icon}
                     </Box>

                     <Typography
                       variant="h5"
                       sx={{
                         fontWeight: 700,
                         mb: 2,
                         color: colors.textPrimary,
                       }}
                     >
                       {step.title}
                     </Typography>

                     <Typography
                       variant="body1"
                       sx={{
                         color: colors.textSecondary,
                         lineHeight: 1.6,
                       }}
                     >
                       {step.description}
                     </Typography>
                   </Card>
                 </motion.div>
               </Grid>
             ))}
           </Grid>
         </motion.div>
       </Container>
     </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: gradients.primary,
          color: "white",
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <motion.div {...animations.scaleIn}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2.5rem", md: "4rem" },
                fontWeight: 800,
                mb: 4,
              }}
            >
              Ready to Take Control?
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 6,
                opacity: 0.9,
                fontSize: { xs: "1.1rem", md: "1.3rem" },
              }}
            >
              Join the future of digital identity. Secure, private, and completely under your control.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleGetStartedClick}
              sx={{
                px: 8,
                py: 3,
                backgroundColor: isDark ? theme.palette.background.paper : "white",
                color: colors.primary,
                borderRadius: "50px",
                fontSize: "1.2rem",
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                "&:hover": {
                  backgroundColor: isDark ? theme.palette.background.paper : "white",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Start Your Journey
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 6, backgroundColor: isDark ? "#0a0f1e" : "#0f172a", color: "white" }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                background: gradients.primary,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SecureDigitalWallet
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mb: 4 }}>
              Empowering Self-Sovereign Identity with Blockchain Security
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mb: 4, flexWrap: "wrap" }}>
            <Button sx={{ color: "white", textTransform: "none", opacity: 0.8 }}>Privacy Policy</Button>
            <Button sx={{ color: "white", textTransform: "none", opacity: 0.8 }}>Terms of Service</Button>
            <Button sx={{ color: "white", textTransform: "none", opacity: 0.8 }}>Contact</Button>
            <Button sx={{ color: "white", textTransform: "none", opacity: 0.8 }}>Documentation</Button>
          </Box>

        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
