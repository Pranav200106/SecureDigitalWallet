import React, { createContext } from 'react';

export const AuthContext = createContext({
  isAuthenticated: false,
  currentUser: null,
  login: () => {},
  logout: () => {}
});