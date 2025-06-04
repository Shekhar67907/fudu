import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './components/Home/HomePage';
import PrescriptionPage from './components/Prescription/PrescriptionPage';
import OrderCardForm from './components/OrderCard/OrderCardForm';
import BillingPage from './components/Billing/BillingPage';
import ContactLensPage from './components/ContactLens/ContactLensPage';
import TestConnection from './components/TestConnection';

function App() {
  return (
    <Router>
      <MainLayout>
        <TestConnection />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prescription" element={<PrescriptionPage />} />
          <Route path="/order-card" element={<OrderCardForm />} />
          <Route path="/contact-lens-card" element={<ContactLensPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/customer-history" element={<div>Customer History Page - Coming Soon</div>} />
          <Route path="/database-backup" element={<div>Database Backup Page - Coming Soon</div>} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;