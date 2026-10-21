import { Eye, Thermometer, Activity, AlertTriangle } from 'lucide-react';

export default function Sinais() {
  return (
    <section id="sinais" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Fique Atento aos Sinais
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Identificar sinais precocemente é fundamental para evitar complicações graves.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Mudanças de cor</h3>
            <p className="text-sm text-slate-600">Vermelhidão, escurecimento ou palidez nos pés.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Thermometer className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Dormência</h3>
            <p className="text-sm text-slate-600">Formigamento e perda de sensibilidade tátil.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Inchaço</h3>
            <p className="text-sm text-slate-600">Sensação de aperto ou inchaço nas pernas e pés.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Feridas</h3>
            <p className="text-sm text-slate-600">Feridas que não cicatrizam ou demoram a fechar.</p>
          </div>
        </div>
      </div>
    </section>
  );
}