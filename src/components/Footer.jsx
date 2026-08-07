import React from "react";      

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm space-y-3">
            <p className="font-semibold text-slate-300">Tecido-NO • Biotecnologia & Saúde Preventiva</p>
            <p>© {new Date().getFullYear()} Todos os direitos reservados.</p>
          </div>
        </footer>
    );
}