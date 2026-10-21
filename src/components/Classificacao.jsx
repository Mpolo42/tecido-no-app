import grau1 from "../assets/img/grau1.png";
import grau2 from "../assets/img/grau2.png";
import grau3 from "../assets/img/grau3.png";
import grau4 from "../assets/img/grau4.png";
import grau5 from "../assets/img/grau5.png";
export default function Classificação ( ) {
    return (
         <section id="classificacao" className="py-20 bg-white border-t border-slate-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                        Classificação das Feridas (Wagner)
                      </h2>
                      <p className="mt-4 text-lg text-slate-600">
                        Identificação exata dos graus da ferida para direcionar o tratamento adequado.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                      {/* GRAU 1 */}
                      <div className="border-2 border-slate-200 rounded-3xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <span className="inline-block w-full text-center px-3 py-1.5 text-xs font-extrabold rounded-xl border mb-4 uppercase tracking-wider bg-amber-100 text-amber-900 border-amber-300">
                            Grau 1
                          </span>
                          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 h-40 mb-4">
                            <img
                              src={grau1}
                              alt="Grau 1 - Úlcera Superficial"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">Úlcera Superficial</h3>
                          <p className="text-sm font-semibold text-slate-800 mb-2">Pele e tecido subcutâneo afetados.</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3 mt-2">Ferida em camada rasa da pele, sem atingir tecidos profundos.</p>
                      </div>

                      {/* GRAU 2 */}
                      <div className="border-2 border-slate-200 rounded-3xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <span className="inline-block w-full text-center px-3 py-1.5 text-xs font-extrabold rounded-xl border mb-4 uppercase tracking-wider bg-orange-100 text-orange-900 border-orange-300">
                            Grau 2
                          </span>
                          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 h-40 mb-4">
                            <img
                              src={grau2}
                              alt="Grau 2 - Úlcera Profunda"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">Úlcera Profunda</h3>
                          <p className="text-sm font-semibold text-slate-800 mb-2">Atinge tendão, músculo ou osso.</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3 mt-2">Lesão ultrapassa a pele, alcançando estruturas profundas.</p>
                      </div>

                      {/* GRAU 3 */}
                      <div className="border-2 border-slate-200 rounded-3xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <span className="inline-block w-full text-center px-3 py-1.5 text-xs font-extrabold rounded-xl border mb-4 uppercase tracking-wider bg-red-100 text-red-900 border-red-300">
                            Grau 3
                          </span>
                          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 h-40 mb-4">
                            <img
                              src={grau3}
                              alt="Grau 3 - Úlcera com Pus"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">Úlcera com Pus</h3>
                          <p className="text-sm font-semibold text-slate-800 mb-2">Presença de abscesso ou infecção.</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3 mt-2">Lesão grave com pus ou infecção óssea (osteomielite).</p>
                      </div>

                      {/* GRAU 4 */}
                      <div className="border-2 border-slate-200 rounded-3xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <span className="inline-block w-full text-center px-3 py-1.5 text-xs font-extrabold rounded-xl border mb-4 uppercase tracking-wider bg-purple-100 text-purple-900 border-purple-300">
                            Grau 4
                          </span>
                          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 h-40 mb-4">
                            <img
                              src={grau4}
                              alt="Grau 4 - Gangrena Parcial"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">Gangrena Parcial</h3>
                          <p className="text-sm font-semibold text-slate-800 mb-2">Gangrena nos dedos ou calcanhar.</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3 mt-2">Tecido morto localizado em uma parte específica do pé.</p>
                      </div>

                      {/* GRAU 5 */}
                      <div className="border-2 border-slate-200 rounded-3xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                          <span className="inline-block w-full text-center px-3 py-1.5 text-xs font-extrabold rounded-xl border mb-4 uppercase tracking-wider bg-slate-900 text-white border-slate-900">
                            Grau 5
                          </span>
                          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 h-40 mb-4">
                            <img
                              src={grau5}
                              alt="Grau 5 - Gangrena Total"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">Gangrena Total</h3>
                          <p className="text-sm font-semibold text-slate-800 mb-2">Acometimento de todo o pé.</p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-3 mt-2">Estágio crítico com comprometimento de todo o pé.</p>
                      </div>

                    </div>
                  </div>
                </section>
    )
}