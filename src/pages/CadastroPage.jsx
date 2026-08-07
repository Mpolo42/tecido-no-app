import React from 'react';
import FormCadastro from '../components/FormCadastro';

export default function CadastroPage({
  formData,
  handleChange,
  handleComorbidadeChange,
  handleSubmit,
  setFoto,
  loading,
  mensagem
}) {
  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <FormCadastro 
        formData={formData}
        handleChange={handleChange}
        handleComorbidadeChange={handleComorbidadeChange}
        handleSubmit={handleSubmit}
        setFoto={setFoto}
        loading={loading}
        mensagem={mensagem}
      />
    </div>
  );
}