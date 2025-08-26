import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { CurrencyInput } from "./CurrencyInput";

interface Duplicata {
  id: string;
  valor: string;
  data: string;
}

interface CalculoResultado {
  totalBruto: number;
  totalDesagio: number;
  totalCustos: number;
  valorLiquido: number;
  linhas: Array<{
    titulo: string;
    dias: number;
    valorFace: number;
    desagio: number;
    valorLiquido: number;
  }>;
}

const CalculatorSection: React.FC = () => {
  const [duplicatas, setDuplicatas] = useState<Duplicata[]>([]);
  const [taxaMensal, setTaxaMensal] = useState<string>("5.00");
  const [resultado, setResultado] = useState<CalculoResultado | null>(null);
  const [showResultado, setShowResultado] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const saveToLocalStorage = (data: {
    duplicatas: Duplicata[];
    taxaMensal: string;
    resultado: CalculoResultado | null;
    showResultado: boolean;
  }) => {
    try {
      localStorage.setItem("calculatorData", JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao salvar no localStorage:", error);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("calculatorData");
      if (saved) {
        const data = JSON.parse(saved);
        setDuplicatas(data.duplicatas || []);
        setTaxaMensal(data.taxaMensal || "5.00");
        setResultado(data.resultado || null);
        setShowResultado(data.showResultado || false);
        return true;
      }
    } catch (error) {
      console.error("Erro ao carregar do localStorage:", error);
    }
    return false;
  };

  useEffect(() => {
    if (!loadFromLocalStorage()) {
      addDuplicata();
    }
  }, []);

  useEffect(() => {
    if (duplicatas.length > 0) {
      saveToLocalStorage({
        duplicatas,
        taxaMensal,
        resultado,
        showResultado,
      });
    }
  }, [duplicatas, taxaMensal, resultado, showResultado]);

  const addDuplicata = () => {
    const newDuplicata: Duplicata = {
      id: Date.now().toString(),
      valor: "",
      data: today,
    };
    setDuplicatas([...duplicatas, newDuplicata]);
    toast.success("Duplicata adicionada com sucesso!");
  };

  const removeDuplicata = (id: string) => {
    setDuplicatas(duplicatas.filter((d) => d.id !== id));
    toast.success("Duplicata removida com sucesso!");
  };

  const updateDuplicata = (
    id: string,
    field: "valor" | "data",
    value: string
  ) => {
    setDuplicatas(
      duplicatas.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleValorChange = (id: string, value: number) => {
    updateDuplicata(id, "valor", value.toString());
  };

  const parseMoeda = (value: string): number => {
    if (value.includes("R$")) {
      return (
        parseFloat(
          value.replace("R$", "").replace(/\./g, "").replace(",", ".")
        ) || 0
      );
    }

    const numeros = value.replace(/\D/g, "");
    if (numeros) {
      return parseInt(numeros) / 100;
    }

    return 0;
  };

  const calcular = () => {
    if (duplicatas.length === 0) {
      toast.error("Adicione pelo menos uma duplicata para calcular.");
      return;
    }

    const taxa = parseFloat(taxaMensal) || 5.0;
    const tarifaAvulsa = 25.0;
    const tarifaTED = 7.0;
    const custoConsulta = 9.8;

    let totalBruto = 0;
    let totalDesagio = 0;
    const linhas: CalculoResultado["linhas"] = [];

    for (let i = 0; i < duplicatas.length; i++) {
      const duplicata = duplicatas[i];

      if (!duplicata.valor || !duplicata.data) {
        toast.error(
          "Por favor, preencha todos os campos (Valor e Data) corretamente."
        );
        return;
      }

      const valor = parseMoeda(duplicata.valor);
      const dataVencStr = duplicata.data;

      if (!valor || !dataVencStr) {
        toast.error(
          "Por favor, preencha todos os campos (Valor e Data) corretamente."
        );
        return;
      }

      const hoje = new Date();
      const dataVenc = new Date(dataVencStr + "T00:00:00");
      hoje.setHours(0, 0, 0, 0);

      if (dataVenc < hoje) {
        toast.error("A data de vencimento não pode ser no passado.");
        return;
      }

      const diffTime = Math.abs(dataVenc.getTime() - hoje.getTime());
      const diffDaysBase = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffDaysComFloat = Math.max(1, diffDaysBase) + 2;

      const taxaDiaria = taxa / 30;
      const valorDesagio = valor * (taxaDiaria / 100) * diffDaysComFloat;
      const valorLiquidoIndividual = valor - valorDesagio;

      totalBruto += valor;
      totalDesagio += valorDesagio;

      linhas.push({
        titulo: `Título ${i + 1}`,
        dias: diffDaysComFloat,
        valorFace: valor,
        desagio: valorDesagio,
        valorLiquido: valorLiquidoIndividual,
      });
    }

    const totalCustosPorTitulo = custoConsulta * duplicatas.length;
    const totalTarifas = tarifaAvulsa + totalCustosPorTitulo;
    const totalLiquido = totalBruto - totalDesagio - totalTarifas - tarifaTED;

    setResultado({
      totalBruto,
      totalDesagio,
      totalCustos: totalTarifas,
      valorLiquido: totalLiquido,
      linhas,
    });
    setShowResultado(true);
    toast.success("Cálculo realizado com sucesso!");
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };
  const limparDados = () => {
    setDuplicatas([]);
    setResultado(null);
    setShowResultado(false);
    setTaxaMensal("5.00");

    try {
      localStorage.removeItem("calculatorData");
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error);
    }

    const newDuplicata: Duplicata = {
      id: Date.now().toString(),
      valor: "",
      data: today,
    };
    setDuplicatas([newDuplicata]);
    toast.success("Dados limpos com sucesso!");
  };

  const gerarPDF = async () => {
    if (!resultado) {
      toast.error("Nenhum resultado para gerar PDF.");
      return;
    }

    try {
      toast.info("Gerando PDF...");

      // Criar um elemento temporário para o PDF
      const pdfElement = document.createElement("div");
      pdfElement.style.width = "210mm";
      pdfElement.style.padding = "25mm";
      pdfElement.style.backgroundColor = "#ffffff";
      pdfElement.style.fontFamily = "Arial, sans-serif";
      pdfElement.style.fontSize = "11px";
      pdfElement.style.lineHeight = "1.5";
      pdfElement.style.color = "#1f2937";

      // Cabeçalho com logo e informações da empresa
      pdfElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #374151; padding-bottom: 25px;">
          <div style="margin-bottom: 20px;">
            <div style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 5px;">NOVA VERTE</div>
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Soluções Financeiras</div>
          </div>
          <h1 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: bold;">
            Simulação de Operação Financeira
          </h1>
          <p style="margin: 8px 0; color: #6b7280; font-size: 13px;">
            Data da Simulação: ${new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

        <!-- Configurações da Operação -->
        <div style="margin-bottom: 30px; background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 15px; font-weight: bold; border-bottom: 1px solid #d1d5db; padding-bottom: 8px;">
            Configurações da Operação
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
            <div style="padding: 15px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
              <strong style="color: #374151;">Taxa a.m.:</strong> ${taxaMensal.replace(
                ".",
                ","
              )}%
            </div>
            <div style="padding: 15px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
              <strong style="color: #374151;">Total de Títulos:</strong> ${
                duplicatas.length
              }
            </div>
          </div>
        </div>

        <!-- Tabela de Resultados -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 15px; font-weight: bold; border-bottom: 1px solid #d1d5db; padding-bottom: 8px;">
            Detalhamento dos Títulos
          </h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #d1d5db; font-weight: bold; color: #374151; font-size: 11px;">Título</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #d1d5db; font-weight: bold; color: #374151; font-size: 11px;">Dias</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db; font-weight: bold; color: #374151; font-size: 11px;">Valor Face</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db; font-weight: bold; color: #374151; font-size: 11px;">Deságio</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #d1d5db; font-weight: bold; color: #374151; font-size: 11px;">Valor Líquido</th>
              </tr>
            </thead>
            <tbody>
              ${resultado.linhas
                .map(
                  (linha, index) => `
                <tr style="background: ${
                  index % 2 === 0 ? "#ffffff" : "#f9fafb"
                };">
                  <td style="padding: 12px; border: 1px solid #d1d5db; font-weight: 500; color: #1f2937;">${
                    linha.titulo
                  }</td>
                  <td style="padding: 12px; border: 1px solid #d1d5db; text-align: center; color: #374151;">${
                    linha.dias
                  }</td>
                  <td style="padding: 12px; border: 1px solid #d1d5db; text-align: right; color: #1f2937; font-weight: 500;">${formatCurrency(
                    linha.valorFace
                  )}</td>
                  <td style="padding: 12px; border: 1px solid #d1d5db; text-align: right; color: #dc2626; font-weight: 500;">${formatCurrency(
                    linha.desagio
                  )}</td>
                  <td style="padding: 12px; border: 1px solid #d1d5db; text-align: right; color: #1f2937; font-weight: bold;">${formatCurrency(
                    linha.valorLiquido
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- Resumo Financeiro em Grid -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 15px; font-weight: bold; border-bottom: 1px solid #d1d5db; padding-bottom: 8px;">
            Resumo Financeiro
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
            <div style="background: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0; border-radius: 6px;">
              <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 13px; font-weight: bold;">Receitas</h4>
              <div style="font-size: 18px; font-weight: bold; color: #166534; margin-bottom: 5px;">
                ${formatCurrency(resultado.totalBruto)}
              </div>
              <div style="font-size: 11px; color: #6b7280;">Total Bruto</div>
            </div>
            <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca; border-radius: 6px;">
              <h4 style="margin: 0 0 12px 0; color: #991b1b; font-size: 13px; font-weight: bold;">Despesas</h4>
              <div style="font-size: 18px; font-weight: bold; color: #991b1b; margin-bottom: 5px;">
                ${formatCurrency(
                  resultado.totalDesagio + resultado.totalCustos + 7.0
                )}
              </div>
              <div style="font-size: 11px; color: #6b7280;">Total Despesas</div>
            </div>
          </div>
        </div>

        <!-- Detalhamento dos Custos -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 15px; font-weight: bold; border-bottom: 1px solid #d1d5db; padding-bottom: 8px;">
            Detalhamento dos Custos
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
            <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca; border-radius: 6px;">
              <h4 style="margin: 0 0 15px 0; color: #991b1b; font-size: 13px; font-weight: bold;">Despesas Detalhadas</h4>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #6b7280;">Deságio Total:</span>
                <strong style="color: #991b1b;">${formatCurrency(
                  resultado.totalDesagio
                )}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px 0; border-bottom: 1px solid #fecaca;">
                <span style="color: #6b7280;">Tarifas:</span>
                <strong style="color: #991b1b;">${formatCurrency(
                  resultado.totalCustos
                )}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #6b7280;">TED:</span>
                <strong style="color: #991b1b;">R$ 7,00</strong>
              </div>
            </div>
            <div style="background: #eff6ff; padding: 20px; border: 1px solid #bfdbfe; border-radius: 6px;">
              <h4 style="margin: 0 0 15px 0; color: #1e40af; font-size: 13px; font-weight: bold; text-align: center;">Resultado Final</h4>
              <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: #1e40af; margin-bottom: 8px;">
                  ${formatCurrency(resultado.valorLiquido)}
                </div>
                <div style="font-size: 11px; color: #6b7280;">Valor Líquido a Receber</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rodapé -->
        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 10px;">
          <p style="margin: 0; margin-bottom: 5px;">Este documento foi gerado automaticamente pelo sistema Nova Verte</p>
          <p style="margin: 0;">Para dúvidas, entre em contato conosco</p>
        </div>
      `;

      // Adicionar o elemento ao DOM temporariamente
      document.body.appendChild(pdfElement);

      // Gerar o PDF
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 210 * 5.90551, // Converter mm para px
        height: 297 * 5.90551, // Converter mm para px
      });

      // Remover o elemento temporário
      document.body.removeChild(pdfElement);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `simulacao-nova-verte-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);

      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  return (
    <section id="calculator" className="mt-16 md:mt-20">
      <div className="bg-white shadow-lg mx-auto p-4 sm:p-6 md:p-8 border border-slate-200 rounded-2xl max-w-6xl">
        <div className="items-start gap-4 sm:gap-6 lg:gap-8 grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h3 className="font-bold text-slate-900 text-xl sm:text-2xl">
              Simulador de Operação
            </h3>
            <p className="mt-2 text-slate-600 text-sm sm:text-base">
              Adicione suas duplicatas e configure a operação.
            </p>

            <div className="space-y-4 mt-6">
              <div className="space-y-3 bg-slate-50 p-3 sm:p-4 border border-slate-200 rounded-lg">
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                  Configurações da Operação
                </h4>
                <div>
                  <label
                    htmlFor="taxaInput"
                    className="block font-medium text-slate-700 text-xs sm:text-sm"
                  >
                    Taxa a.m. (%)
                  </label>
                  <CurrencyInput
                    placeholder="00,00"
                    className="mt-1 px-2 py-1.5 border-slate-300 rounded-md w-full text-xs sm:text-sm"
                    value={parseFloat(taxaMensal) || 0}
                    onChange={(value) => setTaxaMensal(value.toString())}
                  />
                </div>
                <div className="pt-3 border-slate-200 border-t">
                  <p className="font-medium text-slate-700 text-sm">
                    Custos Fixos
                  </p>
                  <div className="space-y-2 mt-3 text-slate-600 text-sm">
                    <div className="flex sm:flex-row flex-col sm:justify-between gap-1">
                      <span className="text-xs sm:text-sm">
                        Tarifa de INCLUSÃO Operação:
                      </span>
                      <strong className="text-xs sm:text-sm">R$ 25,00</strong>
                    </div>
                    <div className="flex sm:flex-row flex-col sm:justify-between gap-1">
                      <span className="text-xs sm:text-sm">
                        Tarifa PIX (por OPERAÇÃO):
                      </span>
                      <strong className="text-xs sm:text-sm">R$ 7,00</strong>
                    </div>
                    <div className="flex sm:flex-row flex-col sm:justify-between gap-1">
                      <span className="text-xs sm:text-sm">
                        Registro de Cobrança (por TITULO):
                      </span>
                      <strong className="text-xs sm:text-sm">R$ 9,80</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="duplicatas-container"
                className="space-y-3 py-3 sm:py-4 border-slate-200 border-t border-b"
              >
                {duplicatas.map((duplicata) => (
                  <div
                    key={duplicata.id}
                    className="relative gap-2 grid grid-cols-1 sm:grid-cols-2 p-2 sm:p-3 border border-slate-200 rounded-md duplicata-row"
                  >
                    <CurrencyInput
                      className="block bg-white shadow-sm px-2 sm:px-3 py-2 border border-slate-300 focus:border-brand-green rounded-md focus:outline-none focus:ring-brand-green w-full text-sm valor-input placeholder-slate-400"
                      placeholder="00,00"
                      value={parseFloat(duplicata.valor) || 0}
                      onChange={(value) =>
                        handleValorChange(duplicata.id, value)
                      }
                    />
                    <input
                      type="date"
                      min={today}
                      className="block bg-white shadow-sm px-2 sm:px-3 py-2 border border-slate-300 focus:border-brand-green rounded-md focus:outline-none focus:ring-brand-green w-full text-sm data-input"
                      value={duplicata.data}
                      onChange={(e) =>
                        updateDuplicata(duplicata.id, "data", e.target.value)
                      }
                    />
                    <button
                      className="-top-2 -right-2 absolute bg-white shadow-sm rounded-full text-slate-400 hover:text-red-500 transition-colors remove-btn"
                      onClick={() => removeDuplicata(duplicata.id)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 sm:w-5 h-4 sm:h-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex sm:flex-row flex-col gap-3 sm:gap-4 mt-4">
              <button
                onClick={addDuplicata}
                className="bg-slate-200 hover:bg-slate-300 px-3 sm:px-4 py-2 rounded-lg w-full font-bold text-slate-800 text-sm sm:text-base transition duration-300"
              >
                Adicionar Duplicata
              </button>
              <button
                onClick={calcular}
                className="bg-brand-green hover:bg-brand-green-dark px-3 sm:px-4 py-2 sm:py-3 rounded-lg w-full font-bold text-white text-sm sm:text-base transition duration-300"
              >
                Calcular
              </button>
              <button
                onClick={limparDados}
                className="bg-red-600 hover:bg-red-700 px-3 sm:px-4 py-2 rounded-lg w-full font-bold text-white text-sm sm:text-base transition duration-300"
              >
                Limpar Dados
              </button>
            </div>
          </div>

          {showResultado && resultado && (
            <div
              id="resultadoCalculo"
              className="lg:col-span-3 bg-slate-50 p-6 border border-slate-200 rounded-lg"
            >
              <h3 className="mb-4 font-bold text-slate-900 text-2xl">
                Resultado da Simulação
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-slate-500 text-sm text-left">
                  <thead className="bg-slate-200 text-slate-700 text-xs uppercase">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Título
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                        Dias
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Valor Face
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Deságio (R$)
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Valor Líquido
                      </th>
                    </tr>
                  </thead>
                  <tbody id="resultadoTabela">
                    {resultado.linhas.map((linha, index) => (
                      <tr key={index} className="bg-white border-b">
                        <td className="px-4 py-2 font-medium text-slate-900">
                          {linha.titulo}
                        </td>
                        <td className="px-4 py-2 text-center">{linha.dias}</td>
                        <td className="px-4 py-2 text-right">
                          {formatCurrency(linha.valorFace)}
                        </td>
                        <td className="px-4 py-2 text-red-600 text-right">
                          {formatCurrency(linha.desagio)}
                        </td>
                        <td className="px-4 py-2 font-bold text-slate-900 text-right">
                          {formatCurrency(linha.valorLiquido)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                id="tarifasExplicacao"
                className="mt-6 pt-4 border-slate-200 border-t"
              >
                <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="font-bold text-slate-800">
                      Resumo Financeiro
                    </h4>
                    <p className="mb-2 text-slate-500 text-xs">
                      Deságio calculado com taxa de{" "}
                      <strong>{taxaMensal.replace(".", ",")}%</strong> a.m.
                    </p>
                  </div>
                  <div className="flex sm:flex-row flex-col gap-2">
                    <button
                      onClick={gerarPDF}
                      className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg font-medium text-white text-sm transition duration-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Exportar PDF
                    </button>
                    <button
                      onClick={limparDados}
                      className="flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg font-medium text-white text-sm transition duration-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Limpar Dados
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mt-2 pt-4 border-slate-300 border-t-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Bruto (Soma):</span>
                  <strong id="totalBruto" className="text-slate-800">
                    {formatCurrency(resultado.totalBruto)}
                  </strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Deságio:</span>
                  <strong id="totalDesagio" className="text-red-600">
                    {formatCurrency(resultado.totalDesagio)}
                  </strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total de Tarifas:</span>
                  <strong id="totalCustos" className="text-red-600">
                    {formatCurrency(resultado.totalCustos)}
                  </strong>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-slate-300 border-t">
                  <span className="font-bold text-slate-800 text-lg">
                    Total Líquido a Receber:
                  </span>
                  <strong
                    id="valorLiquido"
                    className="font-bold text-2xl brand-green"
                  >
                    {formatCurrency(resultado.valorLiquido)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CalculatorSection;
