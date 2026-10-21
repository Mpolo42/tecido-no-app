import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const perguntas = [
  {
    pergunta: 'Em que momento devo trocar o curativo?',
    resposta: 'As gazes e ataduras externas (curativo secundário) precisam ser trocadas TODO DIA. A cobertura cinza (Tecido-NO / curativo primário) fica em contato direto com o machucado e é trocada apenas se estiver muito molhada ou se a borda da ferida estiver esbranquiçada.',
  },
  {
    pergunta: 'Qual o tempo máximo que posso ficar com o Tecido-NO?',
    resposta: 'O tempo máximo de uso do tecido é de até 7 dias, mas a orientação correta deve ser dada pelo seu profissional de saúde.',
  },
  {
    pergunta: 'Posso lavar e reutilizar a gaze e a atadura?',
    resposta: 'NÃO REUTILIZE NUNCA! Lavar esses materiais não remove as bactérias e pode causar infecções graves ou piorar a ferida.',
  },
  {
    pergunta: 'Posso tomar banho normal com o curativo?',
    resposta: 'O curativo NÃO PODE MOLHAR DE JEITO NENHUM. Proteja o pé durante o banho colocando um saco plástico limpo ou filme plástico (PVC) bem vedado no tornozelo para a água com sabão não entrar.',
  },
  {
    pergunta: 'Quais são os sinais de alerta de que a ferida piorou?',
    resposta: 'Procure ajuda imediatamente se notar: pele muito vermelha ou quente ao redor, mau cheiro, aumento da dor, saída de pus ou se a ferida estiver aumentando de tamanho.',
  },
];

export default function FAQ() {
  const [aberto, setAberto] = useState(null);

  return (
    <section id="faq" aria-labelledby="titulo-faq" className="py-20 bg-slate-100 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 id="titulo-faq" className="text-3xl sm:text-4xl font-extrabold text-slate-900">Perguntas frequentes e orientação</h2>
          <p className="mt-4 text-lg text-slate-600">Tire suas dúvidas sobre o uso do curativo e como agir em cada etapa.</p>
        </div>
        <div className="space-y-4">
          {perguntas.map(({ pergunta, resposta }, index) => (
            <div key={pergunta} className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3>
                <button type="button" id={`faq-pergunta-${index}`} aria-expanded={aberto === index} aria-controls={`faq-resposta-${index}`} onClick={() => setAberto(aberto === index ? null : index)} className="w-full px-5 sm:px-6 py-5 text-left font-bold text-lg text-slate-900 rounded-2xl flex justify-between items-center hover:bg-slate-50 transition gap-4 cursor-pointer">
                  <span>{pergunta}</span>
                  {aberto === index ? <ChevronUp aria-hidden="true" className="w-6 h-6 text-indigo-600 shrink-0" /> : <ChevronDown aria-hidden="true" className="w-6 h-6 text-slate-500 shrink-0" />}
                </button>
              </h3>
              <div id={`faq-resposta-${index}`} role="region" aria-labelledby={`faq-pergunta-${index}`} hidden={aberto !== index} className="px-5 sm:px-6 pb-6 text-slate-700 text-base leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50 rounded-b-2xl">
                {resposta}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to="/cadastro" className="inline-flex min-h-12 items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition">Fazer cadastro para acompanhamento</Link>
        </div>
      </div>
    </section>
  );
}
