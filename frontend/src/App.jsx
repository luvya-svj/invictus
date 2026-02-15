import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Mapping from './pages/Mapping';
import Production from './pages/Production';
import ExcelViewer from './pages/ExcelViewer';
import AnalyticsPlatform from './pages/AnalyticsPlatform';
import Procurement from './pages/Procurement';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <PrivateRoute>
                  <Inventory />
                </PrivateRoute>
              }
            />
            <Route
              path="/mapping"
              element={
                <PrivateRoute>
                  <Mapping />
                </PrivateRoute>
              }
            />
            <Route
              path="/production"
              element={
                <PrivateRoute>
                  <Production />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <AnalyticsPlatform />
                </PrivateRoute>
              }
            />
            <Route
              path="/excel-viewer"
              element={
                <PrivateRoute>
                  <AnalyticsPlatform />
                </PrivateRoute>
              }
            />
            <Route
              path="/procurement"
              element={
                <PrivateRoute>
                  <Procurement />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
