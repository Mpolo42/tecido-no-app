import { Link } from 'react-router-dom';
import produto1 from "../assets/img/produto1.jpeg";

export default function Produto() {
    return (
        <section id="produto" className="py-20 bg-slate-50">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-8 sm:p-12 grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                          Nosso Produto
                        </h2>
                        <p className="text-lg text-slate-600 leading-relaxed mb-8">
                          Desenvolvemos produtos especializados para o cuidado do pé diabético, com tecnologia de ponta em fibra de carvão liberadora de óxido nítrico (NO) que promove cicatrização e proteção.
                        </p>
                        <Link to="/cadastro" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition inline-block">
                          Fazer cadastro
                        </Link>
                      </div>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md h-64 sm:h-80 bg-white">
                        <img
                          src={produto1}
                          alt="Tecido NO"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </section>
    )
}
