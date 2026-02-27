/**
 * Lender Auth Context
 * 
 * Completely separate from the gig worker AuthContext.
 * Manages lender authentication state with separate localStorage keys and API endpoints.
 */

import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const LenderAuthContext = createContext();

export const useLenderAuth = () => {
  const context = useContext(LenderAuthContext);
  if (!context) {
    throw new Error("useLenderAuth must be used within LenderAuthProvider");
  }
  return context;
};

export const LenderAuthProvider = ({ children }) => {
  const [lender, setLender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lenderToken, setLenderToken] = useState(localStorage.getItem("lender_token"));

  useEffect(() => {
    if (lenderToken) {
      loadLender();
    } else {
      setLoading(false);
    }
  }, [lenderToken]);

  const getLenderAxios = () => {
    return axios.create({
      headers: {
        Authorization: `Bearer ${lenderToken}`
      }
    });
  };

  const loadLender = async () => {
    try {
      const res = await axios.get("/api/lender-auth/me", {
        headers: { Authorization: `Bearer ${lenderToken}` }
      });
      if (res.data.success) {
        setLender(res.data.lender);
      }
    } catch (error) {
      console.error("Failed to load lender:", error);
      lenderLogout();
    } finally {
      setLoading(false);
    }
  };

  const lenderLogin = async (email, password) => {
    const response = await axios.post("/api/lender-auth/login", { email, password });
    if (response.data.success) {
      const { token, lender } = response.data;
      localStorage.setItem("lender_token", token);
      setLenderToken(token);
      setLender(lender);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const lenderRegister = async (data) => {
    const response = await axios.post("/api/lender-auth/register", data);
    if (response.data.success) {
      const { token, lender } = response.data;
      localStorage.setItem("lender_token", token);
      setLenderToken(token);
      setLender(lender);
      return response.data;
    }
    throw new Error(response.data.message);
  };

  const lenderLogout = () => {
    localStorage.removeItem("lender_token");
    setLenderToken(null);
    setLender(null);
  };

  const value = {
    lender,
    loading,
    lenderToken,
    isLenderAuthenticated: !!lender,
    lenderLogin,
    lenderRegister,
    lenderLogout,
    getLenderAxios
  };

  return <LenderAuthContext.Provider value={value}>{children}</LenderAuthContext.Provider>;
};
