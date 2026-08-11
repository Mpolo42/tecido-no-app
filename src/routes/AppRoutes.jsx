import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from '../pages/Home';
import CadastroPage from '../pages/CadastroPage';
import Login from '../pages/Login';
import AdminDashboard from '../pages/AdminDashboard';

export default function AppRoutes({
  session,
  formData,
  handleChange,
  handleComorbidadeChange,
  handleSubmit,
  setFoto,
  loading,
  mensagem
}) {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route 
        path="/cadastro" 
        element={
          <CadastroPage 
            formData={formData}
            handleChange={handleChange}
            handleComorbidadeChange={handleComorbidadeChange}
            handleSubmit={handleSubmit}
            setFoto={setFoto}
            loading={loading}
            mensagem={mensagem}
          />
        } 
      />
      <Route 
        path="/login" 
        element={session ? <Navigate to="/admin" replace /> : <Login />} 
      />
      <Route 
        path="/admin" 
        element={session ? <AdminDashboard session={session} /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
}