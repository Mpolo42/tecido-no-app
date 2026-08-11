import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Users, FileImage, Search, Filter, MessageCircle, Edit, Trash2, X, Check } from 'lucide-react';

export default function AdminDashboard({ session }) {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  // Estados para Modal de Edição
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [formDataEdit, setFormDataEdit] = useState({});
  const [salvando, setSalvando] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPacientes(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // --- AÇÃO DE EXCLUIR PACIENTE ---
  const handleExcluir = async (id, nome) => {
    const confirmacao = window.confirm(`Tem certeza que deseja excluir o cadastro de "${nome}"? Esta ação não pode ser desfeita.`);
    
    if (!confirmacao) return;

    try {
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove localmente da lista sem precisar recarregar a página
      setPacientes(prev => prev.filter(item => item.id !== id));
      alert('Cadastro excluído com sucesso!');
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  // --- AÇÕES DE EDIÇÃO ---
  const handleAbrirEdicao = (paciente) => {
    setPacienteEditando(paciente);
    setFormDataEdit({
      nome: paciente.nome || '',
      nome_social: paciente.nome_social || '',
      whatsapp: paciente.whatsapp || '',
      sexo: paciente.sexo || '',
      idade: paciente.idade || '',
      tipo_diabetes: paciente.tipo_diabetes || '',
      grau_lesao: paciente.grau_lesao || '',
      tempo_lesao: paciente.tempo_lesao || '',
      localizacao_quadrante: paciente.localizacao_quadrante || ''
    });
  };

  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const { error } = await supabase
        .from('pacientes')
        .update({
          nome: formDataEdit.nome,
          nome_social: formDataEdit.nome_social || null,
          whatsapp: formDataEdit.whatsapp ? formDataEdit.whatsapp.replace(/\D/g, '') : null,
          sexo: formDataEdit.sexo,
          idade: parseInt(formDataEdit.idade),
          tipo_diabetes: formDataEdit.tipo_diabetes,
          grau_lesao: formDataEdit.grau_lesao,
          tempo_lesao: formDataEdit.tempo_lesao,
          localizacao_quadrante: formDataEdit.localizacao_quadrante
        })
        .eq('id', pacienteEditando.id);

      if (error) throw error;

      alert('Cadastro atualizado com sucesso!');
      setPacienteEditando(null);
      fetchPacientes(); // Recarrega os dados atualizados
    } catch (error) {
      alert('Erro ao atualizar: ' + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(p => 
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.grau_lesao?.toLowerCase().includes(busca.toLowerCase()) ||
    p.whatsapp?.includes(busca)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Users className="text-indigo-600 w-8 h-8" />
            Painel do Administrador
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Sessão ativa: <span className="font-semibold text-slate-800">{session?.user?.email}</span>
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

      {/* BARRA DE PESQUISA */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, WhatsApp ou grau da lesão..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none text-sm shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border-2 border-slate-200 text-slate-700 text-sm font-bold shadow-sm">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Total: {pacientesFiltrados.length} Cadastros</span>
        </div>
      </div>

      {/* TABELA DE PACIENTES */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold">Carregando dados do Supabase...</div>
      ) : pacientesFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-slate-200 text-slate-500 font-medium">
          Nenhum paciente encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs uppercase font-extrabold tracking-wider">
                  <th className="p-4">Paciente</th>
                  <th className="p-4">Contato (WhatsApp)</th>
                  <th className="p-4">Idade / Sexo</th>
                  <th className="p-4">Diabetes</th>
                  <th className="p-4">Lesão</th>
                  <th className="p-4">Localização</th>
                  <th className="p-4">Foto</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {pacientesFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-base">{item.nome}</div>
                      {item.nome_social && <div className="text-xs text-indigo-600 font-medium">Social: {item.nome_social}</div>}
                    </td>
                    <td className="p-4">
                      {item.whatsapp ? (
                        <a 
                          href={`https://wa.me/55${item.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl border border-emerald-200 text-xs transition"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          {item.whatsapp}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Não informado</span>
                      )}
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
                      <div className="text-xs text-slate-500 mt-1">{item.tempo_lesao}</div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {item.localizacao_quadrante}
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
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Botão Editar */}
                        <button
                          onClick={() => handleAbrirEdicao(item)}
                          title="Editar Cadastro"
                          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        {/* Botão Excluir */}
                        <button
                          onClick={() => handleExcluir(item.id, item.nome)}
                          title="Excluir Cadastro"
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-200 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DO PACIENTE */}
      {pacienteEditando && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Editar Paciente: {pacienteEditando.nome}
              </h2>
              <button 
                onClick={() => setPacienteEditando(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required 
                    value={formDataEdit.nome} 
                    onChange={(e) => setFormDataEdit({...formDataEdit, nome: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Social</label>
                  <input 
                    type="text" 
                    value={formDataEdit.nome_social} 
                    onChange={(e) => setFormDataEdit({...formDataEdit, nome_social: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp</label>
                  <input 
                    type="text" 
                    value={formDataEdit.whatsapp} 
                    onChange={(e) => setFormDataEdit({...formDataEdit, whatsapp: e.target.value.replace(/\D/g, '')})}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sexo</label>
                    <select 
                      value={formDataEdit.sexo} 
                      onChange={(e) => setFormDataEdit({...formDataEdit, sexo: e.target.value})}
                      className="w-full px-2 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                    >
                      <option value="M">Masc</option>
                      <option value="F">Fem</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Idade</label>
                    <input 
                      type="number" 
                      required 
                      value={formDataEdit.idade} 
                      onChange={(e) => setFormDataEdit({...formDataEdit, idade: e.target.value})}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Diabetes</label>
                  <select 
                    value={formDataEdit.tipo_diabetes} 
                    onChange={(e) => setFormDataEdit({...formDataEdit, tipo_diabetes: e.target.value})}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Tipo 1">Tipo 1</option>
                    <option value="Tipo 2">Tipo 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grau da Lesão</label>
                  <input 
                    type="text" 
                    value={formDataEdit.grau_lesao} 
                    onChange={(e) => setFormDataEdit({...formDataEdit, grau_lesao: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempo da Lesão</label>
                  <input 
                    type="text" 
                    value={formDataEdit.tempo_lesao} 
                    onChange={(e) => setFormDataEdit({...formDataEdit, tempo_lesao: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Localização / Quadrante</label>
                  <input 
                    type="text" 
                    value={formDataEdit.localizacao_quadrante} 
                    onChange={(e) => setFormDataEdit({...formDataEdit, localizacao_quadrante: e.target.value})}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={() => setPacienteEditando(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl border border-slate-300 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-6 py-2.5 text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:bg-indigo-400"
                >
                  <Check className="w-4 h-4" />
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}