import React from 'react';
import heroImg from '../assets/img/hero1.jpg';

export default function Hero() {
  return (
    <section id="sobre" className="relative bg-gradient-to-r from-indigo-900 via-purple-900 to-fuchsia-900 text-white py-20 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-purple-200 border border-white/20 mb-6">
            SAÚDE & INOVAÇÃO
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Pé Diabético: <br />Cuidados Essenciais
          </h1>
          <p className="text-purple-100 text-lg sm:text-xl mb-8 leading-relaxed max-w-xl">
            Informação e cuidados para proteger seus pés. Previna complicações com orientações profissionais e produtos adequados[cite: 1, 3].
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#cuidados" className="bg-white hover:bg-slate-100 text-purple-950 font-bold px-8 py-3.5 rounded-xl shadow-lg transition">
              Ver Cuidados
            </a>
            <a href="#produto" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold px-8 py-3.5 rounded-xl transition">
              Nosso Produto
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-purple-950">
            <img 
              src={heroImg} 
              alt="Atendimento Médico ao Pé Diabético" 
              className="w-full object-cover h-80 sm:h-96" 
              onError={(e) => {
                // Fallback de segurança se a imagem falhar
                e.target.src = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}