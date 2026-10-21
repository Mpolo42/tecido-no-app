import { Link } from 'react-router-dom';
import { CONSENT_VERSION } from '../lib/validation';

// O responsável pelo serviço deve revisar este texto e completar a governança
// e os canais oficiais antes de adotá-lo como política jurídica definitiva.
export default function PrivacyPage() {
  return (
    <section aria-labelledby="titulo-privacidade" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link to="/cadastro" className="inline-flex min-h-11 items-center text-indigo-700 font-semibold underline underline-offset-4 rounded-lg">Voltar ao cadastro</Link>
      <h1 id="titulo-privacidade" className="mt-5 text-3xl sm:text-4xl font-extrabold text-slate-900">Privacidade e consentimento</h1>
      <p className="mt-3 text-sm text-slate-600">Versão {CONSENT_VERSION}</p>
      <div className="mt-8 space-y-8 text-base leading-relaxed text-slate-700">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Para que serve o cadastro</h2>
          <p>Os dados informados no Tecido-NO são utilizados para identificar e entrar em contato com o paciente e apoiar seu acompanhamento pela equipe responsável.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Quais informações são solicitadas</h2>
          <p>O formulário solicita nome, telefone, sexo, idade, tipo de diabetes e informações sobre a lesão. Nome social, comorbidades e foto são opcionais.</p>
          <p className="mt-3">A foto, quando anexada, integra os dados de acompanhamento. Você pode concluir o cadastro sem foto. Evite incluir rosto, documentos ou outras pessoas na imagem.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Quem pode acessar</h2>
          <p>O acesso aos cadastros e às fotos é destinado à equipe autorizada responsável pelo acompanhamento dos pacientes.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">O que você autoriza</h2>
          <p>Ao marcar o consentimento no formulário, você autoriza o uso das informações fornecidas e da foto, se anexada, para o acompanhamento descrito nesta página. A versão do consentimento é registrada junto ao cadastro.</p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Correção, exclusão e dúvidas</h2>
          <p>Para solicitar a correção ou a exclusão dos seus dados, ou esclarecer dúvidas sobre acesso e conservação das informações, entre em contato com a equipe que acompanha o paciente pelo canal já utilizado no atendimento.</p>
        </div>
      </div>
      <Link to="/cadastro" className="mt-10 inline-flex min-h-12 items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition">Ir para o cadastro</Link>
    </section>
  );
}
