import React from "react";

const BenefitsSection: React.FC = () => {
  return (
    <section className="mt-16 md:mt-20">
      <div className="text-center">
        <h3 className="font-bold text-slate-900 text-3xl">
          Nossos Diferenciais
        </h3>
        <p className="mx-auto mt-2 max-w-2xl text-slate-600 text-lg">
          Agilidade, tecnologia e suporte completo para sua empresa.
        </p>
      </div>
      <div className="gap-8 grid grid-cols-1 md:grid-cols-3 mt-10">
        <div className="bg-white shadow p-6 border border-slate-100 rounded-lg text-center">
          <div className="mb-3 text-4xl">💻</div>
          <h4 className="font-bold text-lg">Plataforma 100% Online</h4>
          <p className="mt-1 text-slate-600">
            Acesse, consulte e opere 24 horas por dia, de onde estiver.
          </p>
        </div>
        <div className="bg-white shadow p-6 border border-slate-100 rounded-lg text-center">
          <div className="mb-3 text-4xl">⚡️</div>
          <h4 className="font-bold text-lg">Agilidade e Transparência</h4>
          <p className="mt-1 text-slate-600">
            Processos rápidos, claros e sem burocracia para sua comodidade.
          </p>
        </div>
        <div className="bg-white shadow p-6 border border-slate-100 rounded-lg text-center">
          <div className="mb-3 text-4xl">🤝</div>
          <h4 className="font-bold text-lg">Assessoria Completa</h4>
          <p className="mt-1 text-slate-600">
            Oferecemos suporte mercadológico e jurídico para auxiliar em suas
            decisões.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
