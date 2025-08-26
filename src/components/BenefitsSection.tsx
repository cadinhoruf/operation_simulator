import React from "react";
import { Card, CardContent } from "./ui/card";

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
      <div className="flex md:flex-row flex-col gap-8 mt-10">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-3 text-4xl">💻</div>
            <h4 className="font-bold text-lg">Plataforma 100% Online</h4>
            <p className="mt-1 text-slate-600">
              Acesse, consulte e opere 24 horas por dia, de onde estiver.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-3 text-4xl">⚡️</div>
            <h4 className="font-bold text-lg">Agilidade e Transparência</h4>
            <p className="mt-1 text-slate-600">
              Processos rápidos, claros e sem burocracia para sua comodidade.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-3 text-4xl">🤝</div>
            <h4 className="font-bold text-lg">Assessoria Completa</h4>
            <p className="mt-1 text-slate-600">
              Oferecemos suporte mercadológico e jurídico para auxiliar em suas
              decisões.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default BenefitsSection;
