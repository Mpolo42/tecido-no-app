import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center" aria-labelledby="titulo-nao-encontrado">
      <p className="text-indigo-700 font-bold text-lg">Página não encontrada</p>
      <h1 id="titulo-nao-encontrado" className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900">Este endereço não está disponível</h1>
      <p className="mt-5 text-lg leading-relaxed text-slate-600">Confira o endereço ou escolha uma das opções abaixo para continuar.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link to="/" className="inline-flex min-h-12 items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition">Ir para o início</Link>
        <Link to="/cadastro" className="inline-flex min-h-12 items-center justify-center border border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-bold px-6 py-3 rounded-xl transition">Fazer cadastro</Link>
      </div>
    </section>
  );
}
