import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <h2 className="font-bold text-slate-900 text-3xl md:text-5xl tracking-tight">
        Transforme suas vendas a prazo em{" "}
        <span className="brand-green">caixa imediato</span>.
      </h2>
      <p className="mt-4 text-slate-600 text-lg">
        Com mais de 20 anos de experiência, ajudamos pequenas e médias empresas
        a fortalecer o fluxo de caixa através da antecipação de recebíveis. Uma
        parceria transparente, ágil e focada no seu negócio.
      </p>
    </section>
  );
};

export default HeroSection;
