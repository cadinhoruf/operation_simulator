import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 mt-16 md:mt-20 text-slate-300">
      <div className="mx-auto px-6 py-10 container">
        <div className="gap-8 grid grid-cols-1 md:grid-cols-3 md:text-left text-center">
          <div className="md:col-span-2">
            <h4 className="font-bold text-white text-2xl">
              Pronto para equilibrar seu fluxo de caixa?
            </h4>
            <p className="mt-2 max-w-xl">
              Vamos conversar sobre como podemos ajudar sua empresa a crescer
              com saúde financeira.
            </p>
            <a
              href="mailto:comercial@novaverte.com.br"
              className="inline-block bg-brand-green hover:bg-brand-green-dark mt-6 px-6 py-3 rounded-lg font-bold text-white transition duration-300"
            >
              Entre em Contato
            </a>
          </div>
          <div>
            <h4 className="font-semibold text-white text-lg">Contato</h4>
            <address className="space-y-1 mt-2 not-italic">
              <p>Campinas - SP</p>
              <p>(19) 3045 4600</p>
              <p>(19) 9 9767 7726</p>
              <p>
                <a
                  href="mailto:comercial@novaverte.com.br"
                  className="hover:text-brand-green transition-colors"
                >
                  comercial@novaverte.com.br
                </a>
              </p>
            </address>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
