import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  // Estado local para controlar qual pergunta está aberta
  const [aberto, setAberto] = useState(null);

  const toggle = (index) => {
    setAberto(aberto === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-100 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CABEÇALHO */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Perguntas Frequentes & Orientação
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Tire suas dúvidas sobre o uso do curativo e como agir em cada etapa.
          </p>
        </div>

        {/* LISTA DE PERGUNTAS E RESPOSTAS */}
        <div className="space-y-4">

          {/* PERGUNTA 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              type="button"
              onClick={() => toggle(1)}
              className="w-full px-6 py-5 text-left font-bold text-lg text-slate-900 flex justify-between items-center hover:bg-slate-50 transition gap-4 cursor-pointer"
            >
              <span>1. Em que momento devo trocar o curativo?</span>
              {aberto === 1 ? (
                <ChevronUp className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {aberto === 1 && (
              <div className="px-6 pb-6 text-slate-700 text-base leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                As gazes e ataduras externas (curativo secundário) precisam ser trocadas TODO DIA. A cobertura cinza (Tecido-NO / curativo primário) fica em contato direto com o machucado e é trocada apenas se estiver muito molhada ou se a borda da ferida estiver esbranquiçada.
              </div>
            )}
          </div>

          {/* PERGUNTA 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              type="button"
              onClick={() => toggle(2)}
              className="w-full px-6 py-5 text-left font-bold text-lg text-slate-900 flex justify-between items-center hover:bg-slate-50 transition gap-4 cursor-pointer"
            >
              <span>2. Qual o tempo máximo que posso ficar com o Tecido-NO?</span>
              {aberto === 2 ? (
                <ChevronUp className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {aberto === 2 && (
              <div className="px-6 pb-6 text-slate-700 text-base leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                O tempo máximo de uso do tecido é de até 7 dias, mas a orientação correta deve ser dada pelo seu profissional de saúde.
              </div>
            )}
          </div>

          {/* PERGUNTA 3 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              type="button"
              onClick={() => toggle(3)}
              className="w-full px-6 py-5 text-left font-bold text-lg text-slate-900 flex justify-between items-center hover:bg-slate-50 transition gap-4 cursor-pointer"
            >
              <span>3. Posso lavar e reutilizar a gaze e a atadura?</span>
              {aberto === 3 ? (
                <ChevronUp className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {aberto === 3 && (
              <div className="px-6 pb-6 text-slate-700 text-base leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                NÃO REUTILIZE NUNCA! Lavar esses materiais não remove as bactérias e pode causar infecções graves ou piorar a ferida.
              </div>
            )}
          </div>

          {/* PERGUNTA 4 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              type="button"
              onClick={() => toggle(4)}
              className="w-full px-6 py-5 text-left font-bold text-lg text-slate-900 flex justify-between items-center hover:bg-slate-50 transition gap-4 cursor-pointer"
            >
              <span>4. Posso tomar banho normal com o curativo?</span>
              {aberto === 4 ? (
                <ChevronUp className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {aberto === 4 && (
              <div className="px-6 pb-6 text-slate-700 text-base leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                O curativo NÃO PODE MOLHAR DE JEITO NENHUM. Proteja o pé durante o banho colocando um saco plástico limpo ou filme plástico (PVC) bem vedado no tornozelo para a água com sabão não entrar.
              </div>
            )}
          </div>

          {/* PERGUNTA 5 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button 
              type="button"
              onClick={() => toggle(5)}
              className="w-full px-6 py-5 text-left font-bold text-lg text-slate-900 flex justify-between items-center hover:bg-slate-50 transition gap-4 cursor-pointer"
            >
              <span>5. Quais são os sinais de alerta de que a ferida piorou?</span>
              {aberto === 5 ? (
                <ChevronUp className="w-6 h-6 text-indigo-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-6 h-6 text-slate-400 flex-shrink-0" />
              )}
            </button>
            {aberto === 5 && (
              <div className="px-6 pb-6 text-slate-700 text-base leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                Procure ajuda imediatamente se notar: pele muito vermelha ou quente ao redor, mau cheiro, aumento da dor, saída de pus ou se a ferida estiver aumentando de tamanho.
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}