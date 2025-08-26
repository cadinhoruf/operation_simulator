import jsPDF from "jspdf";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CurrencyInput } from "./CurrencyInput";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

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

  const calcular = useCallback(() => {
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
  }, [duplicatas, taxaMensal]);

  const formatCurrency = useCallback((value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }, []);

  const limparDados = useCallback(() => {
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
  }, [today]);

  const gerarPDF = async () => {
    if (!resultado) {
      toast.error("Nenhum resultado para gerar PDF.");
      return;
    }

    try {
      toast.info("Gerando PDF...");

      // Criar PDF diretamente com jsPDF
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Configurações de fonte
      pdf.setFont("helvetica");

      // Cabeçalho
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("NOVA VERTE", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 6;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Soluções Financeiras", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 12;

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Simulação de Operação Financeira", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 8;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        `Data da Simulação: ${new Date().toLocaleDateString("pt-BR")}`,
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 15;

      // Linha separadora
      pdf.setDrawColor(55, 65, 81);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Configurações da Operação
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Configurações da Operação", margin, yPosition);
      yPosition += 6;

      // Grid de configurações
      const configBoxWidth = (contentWidth - 15) / 2;
      const configBoxHeight = 12;

      // Primeira coluna - Taxa
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, yPosition, configBoxWidth, configBoxHeight, "F");
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(margin, yPosition, configBoxWidth, configBoxHeight, "S");

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(55, 65, 81);
      pdf.text(
        `Taxa a.m.: ${taxaMensal.replace(".", ",")}%`,
        margin + 3,
        yPosition + 8
      );

      // Segunda coluna - Total de Títulos
      pdf.setFillColor(249, 250, 251);
      pdf.rect(
        margin + configBoxWidth + 15,
        yPosition,
        configBoxWidth,
        configBoxHeight,
        "F"
      );
      pdf.setDrawColor(229, 231, 235);
      pdf.rect(
        margin + configBoxWidth + 15,
        yPosition,
        configBoxWidth,
        configBoxHeight,
        "S"
      );

      pdf.text(
        `Total de Títulos: ${duplicatas.length}`,
        margin + configBoxWidth + 18,
        yPosition + 8
      );
      yPosition += configBoxHeight + 15;

      // Tabela de Resultados
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Detalhamento dos Títulos", margin, yPosition);
      yPosition += 6;

      // Cabeçalho da tabela
      const tableHeaders = [
        "Título",
        "Dias",
        "Valor Face",
        "Deságio",
        "Valor Líquido",
      ];
      const columnWidths = [30, 18, 35, 35, 35];
      let xPosition = margin;

      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, yPosition, contentWidth, 10, "F");
      pdf.setDrawColor(209, 213, 219);
      pdf.rect(margin, yPosition, contentWidth, 10, "S");

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 65, 81);

      tableHeaders.forEach((header, index) => {
        const align = index === 0 ? "left" : index === 1 ? "center" : "right";
        pdf.text(header, xPosition + (index === 0 ? 3 : 0), yPosition + 7, {
          align,
        });
        xPosition += columnWidths[index];
      });

      yPosition += 10;

      // Linhas da tabela
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");

      resultado.linhas.forEach((linha, index) => {
        const bgColor = index % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(margin, yPosition, contentWidth, 10, "F");
        pdf.setDrawColor(209, 213, 219);
        pdf.rect(margin, yPosition, contentWidth, 10, "S");

        xPosition = margin;

        // Título
        pdf.setTextColor(31, 41, 55);
        pdf.text(linha.titulo, xPosition + 3, yPosition + 7);
        xPosition += columnWidths[0];

        // Dias
        pdf.setTextColor(55, 65, 81);
        pdf.text(
          linha.dias.toString(),
          xPosition + columnWidths[1] / 2,
          yPosition + 7,
          { align: "center" }
        );
        xPosition += columnWidths[1];

        // Valor Face
        pdf.setTextColor(31, 41, 55);
        pdf.text(
          formatCurrency(linha.valorFace),
          xPosition + columnWidths[2] - 3,
          yPosition + 7,
          { align: "right" }
        );
        xPosition += columnWidths[2];

        // Deságio
        pdf.setTextColor(220, 38, 38);
        pdf.text(
          formatCurrency(linha.desagio),
          xPosition + columnWidths[3] - 3,
          yPosition + 7,
          { align: "right" }
        );
        xPosition += columnWidths[3];

        // Valor Líquido
        pdf.setTextColor(31, 41, 55);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          formatCurrency(linha.valorLiquido),
          xPosition + columnWidths[4] - 3,
          yPosition + 7,
          { align: "right" }
        );
        pdf.setFont("helvetica", "normal");

        yPosition += 10;
      });

      yPosition += 10;

      // Resumo Financeiro em Grid
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55);
      pdf.text("Resumo Financeiro", margin, yPosition);
      yPosition += 6;

      // Grid 2x2 para resumo
      const gridBoxWidth = (contentWidth - 15) / 2;
      const gridBoxHeight = 28;

      // Receitas
      pdf.setFillColor(240, 253, 244);
      pdf.rect(margin, yPosition, gridBoxWidth, gridBoxHeight, "F");
      pdf.setDrawColor(187, 247, 208);
      pdf.rect(margin, yPosition, gridBoxWidth, gridBoxHeight, "S");

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(22, 101, 52);
      pdf.text("Receitas", margin + 3, yPosition + 8);

      pdf.setFontSize(14);
      pdf.text(
        formatCurrency(resultado.totalBruto),
        margin + 3,
        yPosition + 18
      );

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Total Bruto", margin + 3, yPosition + 25);

      // Despesas
      pdf.setFillColor(254, 242, 242);
      pdf.rect(
        margin + gridBoxWidth + 15,
        yPosition,
        gridBoxWidth,
        gridBoxHeight,
        "F"
      );
      pdf.setDrawColor(254, 202, 202);
      pdf.rect(
        margin + gridBoxWidth + 15,
        yPosition,
        gridBoxWidth,
        gridBoxHeight,
        "S"
      );

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(153, 27, 27);
      pdf.text("Despesas", margin + gridBoxWidth + 18, yPosition + 8);

      pdf.setFontSize(14);
      pdf.text(
        formatCurrency(resultado.totalDesagio + resultado.totalCustos + 7.0),
        margin + gridBoxWidth + 18,
        yPosition + 18
      );

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Total Despesas", margin + gridBoxWidth + 18, yPosition + 25);

      yPosition += gridBoxHeight + 15;

      // Resultado Final
      pdf.setFillColor(239, 246, 255);
      pdf.rect(
        margin + gridBoxWidth / 2,
        yPosition,
        gridBoxWidth,
        gridBoxHeight,
        "F"
      );
      pdf.setDrawColor(191, 219, 254);
      pdf.rect(
        margin + gridBoxWidth / 2,
        yPosition,
        gridBoxWidth,
        gridBoxHeight,
        "S"
      );

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 64, 175);
      pdf.text("Resultado Final", margin + gridBoxWidth / 2 + 3, yPosition + 8);

      pdf.setFontSize(16);
      pdf.text(
        formatCurrency(resultado.valorLiquido),
        margin + gridBoxWidth,
        yPosition + 18,
        { align: "center" }
      );

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        "Valor Líquido a Receber",
        margin + gridBoxWidth,
        yPosition + 25,
        { align: "center" }
      );

      yPosition += gridBoxHeight + 10;

      // Rodapé
      pdf.setDrawColor(209, 213, 219);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(7);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text(
        "Este documento foi gerado automaticamente pelo sistema Nova Verte",
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );
      yPosition += 4;
      pdf.text(
        "Para dúvidas, entre em contato conosco",
        pageWidth / 2,
        yPosition,
        { align: "center" }
      );

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

  // Memoizar o resultado para evitar recálculos desnecessários
  const memoizedResultado = useMemo(() => resultado, [resultado]);

  // Memoizar as linhas da tabela
  const memoizedLinhas = useMemo(
    () => memoizedResultado?.linhas || [],
    [memoizedResultado?.linhas]
  );

  return (
    <section id="calculator">
      <Card className="mx-auto max-w-6xl">
        <CardContent className="p-6 md:p-8">
          <div className="items-start gap-8 grid grid-cols-1 lg:grid-cols-5">
            {/* Calculator Form */}
            <div className="lg:col-span-2">
              <h3 className="font-bold text-slate-900 text-2xl">
                Simulador de Operação
              </h3>
              <p className="mt-2 text-slate-600">
                Adicione suas duplicatas e configure a operação.
              </p>

              <div className="space-y-4 mt-6">
                <Card className="max-w-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">
                      Configurações da Operação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-6">
                    <div>
                      <Label htmlFor="taxaInput" className="text-sm">
                        Taxa a.m. (%)
                      </Label>
                      <CurrencyInput
                        placeholder="00,00"
                        className="mt-1"
                        value={parseFloat(taxaMensal) || 0}
                        onChange={(value) => setTaxaMensal(value.toString())}
                      />
                    </div>
                    <div className="pt-3 border-slate-200 border-t">
                      <Label className="font-medium text-sm">
                        Custos Fixos
                      </Label>
                      <div className="space-y-2 mt-3 text-slate-600 text-xs">
                        <p className="flex justify-between">
                          <span>Tarifa de INCLUSÃO:</span>
                          <strong>R$ 25,00</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Tarifa PIX:</span>
                          <strong>R$ 7,00</strong>
                        </p>
                        <p className="flex justify-between">
                          <span>Registro por TÍTULO:</span>
                          <strong>R$ 9,80</strong>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div
                  id="duplicatas-container"
                  className="space-y-3 py-4 border-slate-200 border-t border-b"
                >
                  {duplicatas.map((duplicata) => (
                    <div
                      key={duplicata.id}
                      className="relative gap-2 grid grid-cols-2 p-2 border border-slate-200 rounded-md duplicata-row"
                    >
                      <CurrencyInput
                        className="block bg-white shadow-sm px-3 py-2 border border-slate-300 focus:border-brand-green rounded-md focus:outline-none focus:ring-brand-green w-full placeholder-slate-400"
                        placeholder="00,00"
                        value={parseFloat(duplicata.valor) || 0}
                        onChange={(value) =>
                          handleValorChange(duplicata.id, value)
                        }
                      />
                      <Input
                        type="date"
                        min={today}
                        className="block bg-white shadow-sm px-3 py-2 border border-slate-300 focus:border-brand-green rounded-md focus:outline-none focus:ring-brand-green w-full"
                        value={duplicata.data}
                        onChange={(e) =>
                          updateDuplicata(duplicata.id, "data", e.target.value)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-top-2 -right-2 absolute bg-white p-0 rounded-full w-8 h-8 text-slate-400 hover:text-red-500 transition-colors remove-btn"
                        onClick={() => removeDuplicata(duplicata.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={addDuplicata}
                  className="bg-white hover:bg-gray-100 hover:shadow-sm border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Adicionar Duplicata
                </Button>
                <Button
                  onClick={calcular}
                  className="bg-brand-green hover:bg-brand-green-dark hover:shadow-sm text-white transition-all"
                >
                  Calcular
                </Button>
                <Button
                  variant="outline"
                  onClick={limparDados}
                  className="bg-white hover:bg-red-50 hover:shadow-sm border border-red-200 hover:border-red-300 text-red-600 transition-colors"
                >
                  Limpar Dados
                </Button>
              </div>
            </div>

            {/* Calculator Result - Ao lado do formulário */}
            <div className="lg:col-span-3">
              {showResultado && memoizedResultado ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">
                      Resultado da Simulação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Título</TableHead>
                            <TableHead className="text-xs text-center">
                              Dias (+2 float)
                            </TableHead>
                            <TableHead className="text-xs text-right">
                              Valor Face
                            </TableHead>
                            <TableHead className="text-xs text-right">
                              Deságio (R$)
                            </TableHead>
                            <TableHead className="text-xs text-right">
                              Valor Líquido
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memoizedLinhas.map((linha, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-xs">
                                {linha.titulo}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {linha.dias}
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                {formatCurrency(linha.valorFace)}
                              </TableCell>
                              <TableCell className="text-red-600 text-xs text-right">
                                {formatCurrency(linha.desagio)}
                              </TableCell>
                              <TableCell className="font-bold text-xs text-right">
                                {formatCurrency(linha.valorLiquido)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="space-y-2 pt-2 border-slate-200 border-t">
                      <div className="flex justify-between mb-2 text-xs">
                        <span className="text-slate-600">Total Bruto:</span>
                        <strong className="text-slate-800">
                          {formatCurrency(memoizedResultado.totalBruto)}
                        </strong>
                      </div>
                      <div className="flex justify-between mb-2 text-xs">
                        <span className="text-slate-600">
                          Total Deságio (c/ float):
                        </span>
                        <strong className="text-red-600">
                          {formatCurrency(memoizedResultado.totalDesagio)}
                        </strong>
                      </div>
                      <div className="flex justify-between mb-3 text-xs">
                        <span className="text-slate-600">Total Tarifas:</span>
                        <strong className="text-red-600">
                          {formatCurrency(memoizedResultado.totalCustos)}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center mb-4 pt-2 border-slate-300 border-t">
                        <span className="font-bold text-slate-800 text-sm">
                          Total Líquido:
                        </span>
                        <strong className="font-bold text-lg brand-green">
                          {formatCurrency(memoizedResultado.valorLiquido)}
                        </strong>
                      </div>
                    </div>

                    <div className="flex sm:flex-row flex-col gap-2 pt-2 border-slate-200 border-t">
                      <Button
                        onClick={gerarPDF}
                        variant="outline"
                        size="sm"
                        className="flex justify-center items-center gap-2 bg-white hover:bg-gray-100 hover:shadow-sm border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 transition-colors"
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
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={limparDados}
                        className="flex justify-center items-center gap-2"
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
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-slate-500 text-center">
                    <div className="mb-3 text-3xl">📊</div>
                    <h3 className="mb-2 font-medium text-slate-700 text-base">
                      Resultado da Simulação
                    </h3>
                    <p className="text-xs">
                      Adicione duplicatas e clique em "Calcular" para ver o
                      resultado aqui.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default React.memo(CalculatorSection);
