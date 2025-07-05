// src/pages/Dashboard.jsx
import React from "react";
import { useSelector } from "react-redux";
import styles from "./styles/Dashboard.module.scss";
import AdminPanel from "../AdminPanel/adminPanel";
import UserPanel from "../UserPanel/userPanel";

const Dashboard = () => {
  const user = useSelector((state) => state.user.user);

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.heading}>Welcome, {user?.name}</h2>

      {user?.role === "admin" && <AdminPanel />}
      {user?.role === "user" && <UserPanel />}

      {!user && <p className={styles.message}>Please log in to access your dashboard.</p>}
      {!user?.role && <p className={styles.message}>Role not assigned.</p>}
    </div>
  );
};

export default Dashboard;
