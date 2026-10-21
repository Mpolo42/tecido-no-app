import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm space-y-3">
        <p className="font-semibold text-white">Tecido-NO • Biotecnologia & Saúde Preventiva</p>
        <nav aria-label="Links do rodapé" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <Link to="/cadastro" className="inline-flex items-center min-h-11 underline underline-offset-4 hover:text-white rounded">Fazer cadastro</Link>
          <Link to="/privacidade" className="inline-flex items-center min-h-11 underline underline-offset-4 hover:text-white rounded">Privacidade e consentimento</Link>
          <Link to="/login" className="inline-flex items-center min-h-11 underline underline-offset-4 hover:text-white rounded">Acesso da equipe</Link>
        </nav>
        <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
