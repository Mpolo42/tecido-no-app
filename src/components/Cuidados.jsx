import React from 'react';
import { CheckCircle2 } from 'lucide-react'; // <-- IMPORTANTE: use as chaves { CheckCircle2 }
import cuidepe from '../assets/img/cuidepe.jpg';

export default function Cuidados() {
  return (
    <section id="cuidados" className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Cuide Diariamente
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Higiene, calçados adequados, controle glicêmico e visitas regulares ao médico[cite: 1].
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
            <img src={cuidepe} alt="Exame dos Pés" className="w-full h-80 sm:h-96 object-cover" />
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-slate-800">Lavar os pés diariamente com água morna e sabão neutro[cite: 1].</p>
            </div>
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-slate-800">Secar bem entre os dedos para evitar fungos e frieiras[cite: 1].</p>
            </div>
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-slate-800">Usar calçados confortáveis e macios, evitando pontos de pressão[cite: 1].</p>
            </div>
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-slate-800">Inspecionar seus pés todos os dias com auxílio de um espelho[cite: 1].</p>
            </div>
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-slate-800">Manter o controle rigoroso da glicemia no sangue[cite: 1].</p>
            </div>
            <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-base font-semibold text-slate-800">Visitar seu médico especialista regularmente[cite: 1].</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}