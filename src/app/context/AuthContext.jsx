"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchUser = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data || null);
    } catch (e) {
      console.error("fetchUser error:", e);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // derive role/permissions from whatever columns you have in DB:
  const truthy = (v) => {
    return v === true || v === "true" || v === 1 || v === "1" || Boolean(v);
  };

  const isAprobador = truthy(user?.aprobador);
  const isSolicitante = truthy(user?.solicitante);
  const isComprador = truthy(user?.comprador);
  const isSuperAdmin = truthy(user?.super_admin);

  const permissions = {
    isAprobador,
    isSolicitante,
    isComprador,
    isSuperAdmin,
    // reglas de negocio:
    canCreateRequisition: isSolicitante || isSuperAdmin,
    canViewDashboard: isAprobador || isSuperAdmin,
    canViewRequisiciones: isSolicitante || isAprobador || isComprador || isSuperAdmin,
    // añade más flags según necesites
  };

  const hasRole = (roleName) => {
    switch ((roleName || "").toLowerCase()) {
      case "aprobador":
        return permissions.isAprobador;
      case "solicitante":
        return permissions.isSolicitante;
      case "comprador":
        return permissions.isComprador;
      case "super_admin":
      case "superadmin":
      case "super-admin":
        return permissions.isSuperAdmin;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        role: user?.rol || user?.role || user?.cargo || null,
        permissions,
        hasRole,
        refreshUser: fetchUser,
        loadingUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
