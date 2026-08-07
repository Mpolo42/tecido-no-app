import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, FileImage, Search, Filter, AlertCircle } from 'lucide-react';

// DADOS DE TESTE PARA VISUALIZAR O LAYOUT SEM BANCO DE DADOS
const MOCK_PACIENTES = [
  {
    id: 1,
    nome: 'Maria da Silva Santos',
    nome_social: '',
    idade: 64,
    sexo: 'F',
    tipo_diabetes: 'Tipo 2',
    grau_lesao: 'Grau 2 - Profunda',
    tempo_lesao: '3 semanas',
    localizacao_quadrante: 'Plantar Calcâneo (Pé D)',
    comorbidades: ['Hipertensão', 'Dislipidemia'],
    foto_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
    created_at: '2026-03-12'
  },
  {
    id: 2,
    nome: 'João Pedro Oliveira',
    nome_social: 'Seu Pedrinho',
    idade: 71,
    sexo: 'M',
    tipo_diabetes: 'Tipo 2',
    grau_lesao: 'Grau 1 - Superficial',
    tempo_lesao: '10 dias',
    localizacao_quadrante: 'Hálux Esquerdo (Dorsal)',
    comorbidades: ['Hipertensão', 'Nefropatia'],
    foto_url: null,
    created_at: '2026-03-11'
  },
  {
    id: 3,
    nome: 'Ana Lucia Ferreira',
    nome_social: '',
    idade: 58,
    sexo: 'F',
    tipo_diabetes: 'Tipo 1',
    grau_lesao: 'Grau 3 - Abscesso / Osteomielite',
    tempo_lesao: '2 meses',
    localizacao_quadrante: 'Borda Lateral (Pé E)',
    comorbidades: ['Sobrepeso'],
    foto_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=400&q=80',
    created_at: '2026-03-10'
  }
];

export default function AdminDashboard({ session }) {
  const [pacientes] = useState(MOCK_PACIENTES);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  const pacientesFiltrados = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.grau_lesao?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* BANNER MOCK DE AVISO */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between text-xs font-bold">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>Modo de Visualização: Exibindo dados simulados de teste.</span>
        </div>
      </div>

      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Users className="text-indigo-600 w-8 h-8" />
            Painel do Administrador
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Gestão e Acompanhamento de Cadastros de Pacientes (Tecido-NO)
          </p>
        </div>

        <button 
          onClick={handleLogout}
          className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold px-5 py-2.5 rounded-2xl border border-rose-200 transition flex items-center gap-2 w-fit cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Sair do Painel
        </button>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome do paciente ou grau da lesão..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 text-sm font-bold shadow-sm">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Total: {pacientesFiltrados.length} Registros</span>
        </div>
      </div>

      {/* TABELA DE PACIENTES */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs uppercase font-extrabold tracking-wider">
                <th className="p-4">Paciente</th>
                <th className="p-4">Idade / Sexo</th>
                <th className="p-4">Diabetes</th>
                <th className="p-4">Avaliação da Lesão</th>
                <th className="p-4">Localização</th>
                <th className="p-4">Comorbidades</th>
                <th className="p-4">Foto Anexo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {pacientesFiltrados.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 text-base">{item.nome}</div>
                    {item.nome_social && <div className="text-xs text-indigo-600 font-medium">Social: {item.nome_social}</div>}
                  </td>
                  <td className="p-4 text-slate-700 font-medium">
                    {item.idade} anos ({item.sexo})
                  </td>
                  <td className="p-4 font-semibold text-slate-800">
                    {item.tipo_diabetes}
                  </td>
                  <td className="p-4">
                    <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                      {item.grau_lesao}
                    </span>
                    <div className="text-xs text-slate-500 mt-1 font-medium">Duração: {item.tempo_lesao}</div>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">
                    {item.localizacao_quadrante}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {item.comorbidades?.map((c, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold border border-slate-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    {item.foto_url ? (
                      <a 
                        href={item.foto_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-600 font-bold hover:underline bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 text-xs"
                      >
                        <FileImage className="w-4 h-4" /> Ver Foto
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">Sem foto</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}