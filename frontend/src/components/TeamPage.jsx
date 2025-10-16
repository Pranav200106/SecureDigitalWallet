import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTheme, Box, Container, Typography, Card } from "@mui/material";

const teamMembers = [
  {
    id: 1,
    name: "Deepak Chandrasekhar",
    role: "Team Lead",
    description:
      "Computer Science and Buisness Systems | PSG Institute of Technology and Applied Research",
    image: "/images/d.jpg",
    accent: "#a855f7",
  },
  {
    id: 2,
    name: "Kovarthan Manikandan",
    role: "Team Member",
    description:
      "Mechanical Engineering | PSG Institute of Technology and Applied Research",
    image: "/images/k.jpg",
    accent: "#10b981",
  },
  {
    id: 3,
    name: "Abhimanya S",
    role: "",
    description:
      "Computer Science and Buisness Systems | PSG Institute of Technology and Applied Research",
    image: "/images/m.jpg",
    accent: "#3b82f6",
  },
  {
    id: 4,
    name: "Muthu Harish T",
    role: "Team Member",
    description:
      "Computer Science and Buisness Systems | PSG Institute of Technology and Applied Research",
    image: "/images/ab.jpg",
    accent: "#ef4444",
  },
  {
    id: 5,
    name: "Ajay C",
    role: "Team Member",
    description:
      "Computer Science Engineering | PSG Institute of Technology and Applied Research",
    image: "/images/a.jpg",
    accent: "#f59e0b",
  },
  {
    id: 6,
    name: "Shyam Gokul S",
    role: "Team Member ",
    description:
      "Computer Science Engineering | PSG Institute of Technology and Applied Research",
    image: "/images/ab.jpg",
    accent: "#ec4899",
  },
];

const TeamMemberSection = ({ member, index }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const x = useTransform(scrollYProgress, [0, 0.5, 1], [100, 0, -100]);

  return (
    <Box
      component={motion.section}
      ref={ref}
      style={{ opacity, scale, x }}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        width: "100%",
        py: 8,
        px: { xs: 2, md: 6 },
        backgroundColor: isDark 
          ? `${member.accent}15` 
          : `${member.accent}10`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 6,
            alignItems: "center",
          }}
        >
          <Box
            component={motion.div}
            initial={{ x: -100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            sx={{
              order: { xs: 2, md: 1 },
            }}
          >
            <Card
              sx={{
                borderRadius: "24px",
                overflow: "hidden",
                boxShadow: isDark 
                  ? "0 25px 50px rgba(0, 0, 0, 0.5)"
                  : "0 25px 50px rgba(0, 0, 0, 0.15)",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
              }}
            >
              <Box
                component="img"
                src={member.image}
                alt={member.name}
                sx={{
                  width: "100%",
                  height: { xs: "400px", md: "500px" },
                  objectFit: "cover",
                }}
              />
            </Card>
          </Box>

          <Box
            component={motion.div}
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            sx={{
              order: { xs: 1, md: 2 },
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: "2.5rem", md: "3.5rem" },
                fontWeight: 700,
                mb: 2,
                color: theme.palette.text.primary,
              }}
            >
              {member.name}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: "1.5rem", md: "2rem" },
                mb: 3,
                color: member.accent,
                fontWeight: 600,
              }}
            >
              {member.role}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "1.1rem", md: "1.25rem" },
                color: theme.palette.text.secondary,
                lineHeight: 1.8,
              }}
            >
              {member.description}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

const TeamPage = () => {
  const theme = useTheme();
  
  return (
    <Box sx={{ backgroundColor: theme.palette.background.default }}>
      {teamMembers.map((member, index) => (
        <TeamMemberSection key={member.id} member={member} index={index} />
      ))}
    </Box>
  );
};

export default TeamPage;
