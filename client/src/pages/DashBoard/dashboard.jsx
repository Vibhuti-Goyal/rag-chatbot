// src/pages/Dashboard.jsx
import React from "react";
import { useSelector } from "react-redux";
import styles from "./styles/Dashboard.module.scss";
import AdminPanel from "../AdminPanel/adminPanel";

const Dashboard = () => {
  const user = useSelector((state) => state.user.user);

  return (
    <div className={styles.dashboard}>
      <h2 className={styles.heading}>Welcome, {user?.name}</h2>

      {user?.role === "admin" && <AdminPanel />}
      {!user?.role && <p className={styles.message}>Role not assigned.</p>}
    </div>
  );
};

export default Dashboard;
