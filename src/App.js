import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "antd";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ExpenseDashboard from "./components/ExpenseDashboard";

import Login from "./components/Login";
import Register from "./components/Register";
import ExportPage from "./components/ExportPage"; 
import AdminDashboard from './components/AdminDashboard'; 

const { Content } = Layout;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router> {/* ✅ This should be the ONLY Router in the app */}
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route
              path="/"
              element={
                <Layout style={{ minHeight: "100vh" }}>
                  <Sidebar />
                  <Layout>
                    <Content style={{ margin: "20px" }}>
                      <Dashboard />
                    </Content>
                  </Layout>
                </Layout>
              }
            />
            <Route
              path="/expenses"
              element={
                <Layout style={{ minHeight: "100vh" }}>
                  <Sidebar />
                  <Layout>
                    <Content style={{ margin: "20px" }}>
                      <ExpenseDashboard />
                    </Content>
                  </Layout>
                </Layout>
              }
            />
            
                  
<Route
  path="/admindashboard" 
  element={
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Content style={{ margin: "20px" }}>
          <AdminDashboard /> {/* Now actually using the imported component */}
        </Content>
      </Layout>
    </Layout>
  }
/>
            <Route
              path="/export"
              element={
                <Layout style={{ minHeight: "100vh" }}>
                  <Sidebar />
                  <Layout>
                    <Content style={{ margin: "20px" }}>
                      <ExportPage />
                    </Content>
                  </Layout>
                </Layout>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
};

export default App;
