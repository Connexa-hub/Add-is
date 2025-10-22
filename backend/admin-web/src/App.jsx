import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import Messages from './pages/Messages';
import Support from './pages/Support';
import Cashback from './pages/Cashback';
import VTPassWallet from './pages/VTPassWallet';
import Settings from './pages/Settings';
import KYCManagement from './pages/KYC';
import BannerManagement from './pages/BannerManagement';
import VTUProductManagement from './pages/VTUProductManagement';
import Reconciliation from './pages/Reconciliation';
import QuickAmountGrids from './pages/QuickAmountGrids';
import ScreenContent from './pages/ScreenContent';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashback"
            element={
              <ProtectedRoute>
                <Cashback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vtpass-wallet"
            element={
              <ProtectedRoute>
                <VTPassWallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc"
            element={
              <ProtectedRoute>
                <KYCManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/banners"
            element={
              <ProtectedRoute>
                <BannerManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vtu-products"
            element={
              <ProtectedRoute>
                <VTUProductManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reconciliation"
            element={
              <ProtectedRoute>
                <Reconciliation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quick-amount-grids"
            element={
              <ProtectedRoute>
                <QuickAmountGrids />
              </ProtectedRoute>
            }
          />
          <Route path="/screen-content" element={<ScreenContent />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;