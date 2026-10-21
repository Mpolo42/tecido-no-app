import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Lock, Menu, X } from 'lucide-react';

const links = [
  ['/#sobre', 'O que é?'],
  ['/#sinais', 'Sinais'],
  ['/#classificacao', 'Graus'],
  ['/#cuidados', 'Cuidados'],
  ['/#produto', 'Nosso produto'],
  ['/#faq', 'Perguntas'],
];

export default function Navbar({ session }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuButton = useRef(null);
  const fecharMenu = () => setMenuAberto(false);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && menuAberto) {
      fecharMenu();
      menuButton.current?.focus();
    }
  };

  return (
    <header onKeyDown={handleKeyDown} className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 flex flex-wrap items-center justify-between gap-2 py-3">
        <Link to="/" onClick={fecharMenu} aria-label="Tecido NO, início" className="text-2xl font-extrabold tracking-tight text-slate-900 rounded-lg">
          Tecido<span className="text-indigo-600">NO</span>
        </Link>

        <nav aria-label="Navegação principal" className="hidden xl:flex items-center gap-5 font-medium text-slate-700">
          <Link to="/" className="py-3 hover:text-indigo-600 transition rounded">Início</Link>
          {links.map(([href, texto]) => <Link key={href} to={href} className="py-3 hover:text-indigo-600 transition rounded">{texto}</Link>)}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cadastro" onClick={fecharMenu} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 sm:px-5 py-3 rounded-full shadow-md transition text-sm">
            Cadastro
          </Link>
          <Link to={session ? '/admin' : '/login'} onClick={fecharMenu} aria-label={session ? 'Abrir painel da equipe' : 'Acesso da equipe'} className="hidden sm:inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200">
            {session ? <UserCheck aria-hidden="true" className="w-5 h-5 text-indigo-600" /> : <Lock aria-hidden="true" className="w-5 h-5" />}
          </Link>
          <button ref={menuButton} type="button" aria-expanded={menuAberto} aria-controls="menu-movel" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuAberto(!menuAberto)} className="xl:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100">
            {menuAberto ? <X aria-hidden="true" className="w-6 h-6" /> : <Menu aria-hidden="true" className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <nav id="menu-movel" aria-label="Navegação móvel" hidden={!menuAberto} className="xl:hidden border-t border-slate-200 bg-white px-4 py-3 max-h-[calc(100dvh-5rem)] overflow-y-auto">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 gap-1">
          <Link to="/" onClick={fecharMenu} className="block p-3 rounded-xl font-medium hover:bg-indigo-50 text-slate-800">Início</Link>
          {links.map(([href, texto]) => <Link key={href} to={href} onClick={fecharMenu} className="block p-3 rounded-xl font-medium hover:bg-indigo-50 text-slate-800">{texto}</Link>)}
          <Link to={session ? '/admin' : '/login'} onClick={fecharMenu} className="block p-3 rounded-xl font-semibold hover:bg-indigo-50 text-indigo-700">{session ? 'Painel da equipe' : 'Acesso da equipe'}</Link>
          <Link to="/privacidade" onClick={fecharMenu} className="block p-3 rounded-xl font-medium hover:bg-indigo-50 text-slate-800">Privacidade e consentimento</Link>
        </div>
      </nav>
    </header>
  );
}
