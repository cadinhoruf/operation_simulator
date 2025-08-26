import React from "react";
import BenefitsSection from "./BenefitsSection";
import CalculatorSection from "./CalculatorSection";
import Footer from "./Footer";
import Header from "./Header";
import HeroSection from "./HeroSection";

const NovaVertePage: React.FC = () => {
  return (
    <div className="text-slate-800">
      <Header />

      <main className="mx-auto px-6 py-12 md:py-16 container">
        <HeroSection />
        <CalculatorSection />
        <BenefitsSection />
      </main>

      <Footer />
    </div>
  );
};

export default NovaVertePage;
