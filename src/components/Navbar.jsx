import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Lock } from 'lucide-react'; // <-- Substituído ShieldLock por Lock

export default function Navbar({ session }) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
            Tecido<span className="text-indigo-600">NO</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          <Link to="/" className="hover:text-indigo-600 transition">Início</Link>
          <a href="/#sobre" className="hover:text-indigo-600 transition">O que é?</a>
          <a href="/#sinais" className="hover:text-indigo-600 transition">Sinais</a>
          <a href="/#classificacao" className="hover:text-indigo-600 transition">Graus</a>
          <a href="/#cuidados" className="hover:text-indigo-600 transition">Cuidados</a>
          <a href="/#produto" className="hover:text-indigo-600 transition">Nosso Produto</a>
          <a href="/#faq" className="hover:text-indigo-600 transition">Perguntas</a>
        </nav>

        <div className="flex items-center gap-3">
          {/* BOTÃO DE CADASTRO PARA O PACIENTE */}
          <Link 
            to="/cadastro" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-full shadow-md transition text-sm"
          >
            Cadastro
          </Link>

          {/* ÍCONE DE LOGIN RESTREITO / PAINEL DO ADM */}
          <Link 
            to={session ? "/admin" : "/login"} 
            title={session ? "Painel ADM" : "Login do Administrador"}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
          >
            {session ? (
              <UserCheck className="w-5 h-5 text-indigo-600" />
            ) : (
              <Lock className="w-5 h-5 text-slate-600" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}