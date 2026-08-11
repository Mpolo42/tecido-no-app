import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Lock, Mail, KeyRound, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErro('E-mail ou senha incorretos.');
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Acesso Restrito</h2>
          <p className="text-slate-600 text-sm mt-1">Área exclusiva do Administrador</p>
        </div>

        {erro && (
          <div className="mb-6 p-4 bg-rose-100 border border-rose-300 text-rose-900 rounded-2xl flex items-center gap-3 text-sm font-bold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">E-mail do ADM</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:outline-none bg-white text-base"
                placeholder="admin@exemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Senha</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-indigo-600 focus:outline-none bg-white text-base"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold py-4 rounded-2xl transition shadow-lg text-base cursor-pointer"
          >
            {loading ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}