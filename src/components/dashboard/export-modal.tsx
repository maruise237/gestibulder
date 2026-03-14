'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  HardHat,
  TrendingUp,
  Package,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn, formatCurrency } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getWorkers } from '@/lib/server/worker.actions';
import { getProjects } from '@/lib/server/project.actions';
import { getBudgetData } from '@/lib/server/dashboard.actions';
import { getAllMaterials } from '@/lib/server/stock.actions';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ExportCategory = 'finances' | 'workers' | 'projects' | 'inventory';

interface ExportModalProps {
  trigger?: React.ReactNode;
  enterprise?: any;
}

export function ExportModal({ trigger, enterprise }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ExportCategory[]>(['finances']);
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('xlsx');

  const categories = [
    { id: 'finances', label: 'Finances & Dépenses', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
    { id: 'workers', label: 'Main d\'œuvre', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'projects', label: 'Liste des Chantiers', icon: HardHat, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'inventory', label: 'Stocks & Matériaux', icon: Package, color: 'text-zinc-600 bg-zinc-50' },
  ];

  const toggleCategory = (id: ExportCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      if (format === 'pdf') {
        await handlePdfExport();
      } else {
        await handleExcelCsvExport();
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfExport = async () => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(22);
    doc.text(enterprise?.nom || 'GestiBulder', 14, 20);
    doc.setFontSize(10);
    doc.text(`Rapport généré le : ${dateStr}`, 14, 28);
    doc.line(14, 32, 196, 32);

    let currentY = 40;

    if (selectedCategories.includes('projects')) {
      const { projects } = await getProjects();
      if (projects && projects.length > 0) {
        doc.setFontSize(14);
        doc.text('Liste des Chantiers', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Nom', 'Lieu', 'Budget', 'Statut', 'Progrès']],
          body: projects.map((p: any) => [
            p.nom,
            p.adresse || 'N/A',
            formatCurrency(p.budget_total, enterprise?.devise),
            p.statut,
            `${p.avancement_pct}%`
          ]),
          theme: 'striped',
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    if (selectedCategories.includes('finances')) {
      const { expenses } = await getBudgetData();
      if (expenses && expenses.length > 0) {
        doc.setFontSize(14);
        doc.text('Journal des Dépenses', 14, currentY);
        autoTable(doc, {
          startY: currentY + 5,
          head: [['Libellé', 'Catégorie', 'Date', 'Montant']],
          body: expenses.map((e: any) => [
            e.libelle,
            e.categorie,
            new Date(e.date_operation).toLocaleDateString(),
            formatCurrency(e.montant, enterprise?.devise)
          ]),
          theme: 'striped',
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    doc.save(`rapport_gestibulder_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExcelCsvExport = async () => {
    const wb = XLSX.utils.book_new();

    if (selectedCategories.includes('workers')) {
      const { workers } = await getWorkers(1, 1000);
      if (workers) {
        const ws = XLSX.utils.json_to_sheet(workers);
        XLSX.utils.book_append_sheet(wb, ws, 'Ouvriers');
      }
    }

    if (selectedCategories.includes('projects')) {
      const { projects } = await getProjects();
      if (projects) {
        const ws = XLSX.utils.json_to_sheet(projects);
        XLSX.utils.book_append_sheet(wb, ws, 'Projets');
      }
    }

    if (selectedCategories.includes('finances')) {
      const { expenses } = await getBudgetData();
      if (expenses) {
        const ws = XLSX.utils.json_to_sheet(expenses);
        XLSX.utils.book_append_sheet(wb, ws, 'Dépenses');
      }
    }

    if (selectedCategories.includes('inventory')) {
      const { materials } = await getAllMaterials();
      if (materials) {
        const ws = XLSX.utils.json_to_sheet(materials);
        XLSX.utils.book_append_sheet(wb, ws, 'Stocks');
      }
    }

    const wbout = XLSX.write(wb, { bookType: format as any, type: 'array' });
    const fileName = `export_gestibulder_${new Date().toISOString().split('T')[0]}.${format}`;
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shadow-sm transition-all hover:bg-muted active:scale-95 h-9 w-9 rounded-md border-border">
                <Download size={18} />
                <span className="sr-only">Exporter les données</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Exporter les données</TooltipContent>
        </Tooltip>
      )}
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[600px] rounded-3xl">
        <DialogHeader className="bg-zinc-50/50 border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-zinc-950 text-white rounded-2xl p-3 shadow-lg">
              <Download size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">Configuration de l'Export</DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">
                Choisissez les modules à inclure dans votre rapport
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 p-8 pt-6">
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id as ExportCategory)}
                className={cn(
                  'group relative flex flex-col items-start gap-3 rounded-2xl border p-5 transition-all duration-300',
                  selectedCategories.includes(cat.id as ExportCategory)
                    ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-600/5'
                    : 'border-zinc-100 bg-white hover:border-zinc-200'
                )}
              >
                <div className={cn('rounded-xl p-2 shadow-sm transition-transform group-hover:scale-110', cat.color)}>
                  <cat.icon size={20} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-black tracking-tight text-zinc-900 uppercase">{cat.label}</span>
                {selectedCategories.includes(cat.id as ExportCategory) && (
                  <div className="bg-indigo-600 text-white absolute top-3 right-3 rounded-full p-0.5">
                    <CheckCircle2 size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-zinc-400 text-[10px] font-black tracking-widest uppercase">Format de sortie</h3>
            <div className="flex gap-4">
              {[
                { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
                { id: 'csv', label: 'CSV', icon: FileText },
                { id: 'pdf', label: 'PDF', icon: FileText }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as any)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl border p-3 text-[10px] font-black uppercase tracking-widest transition-all',
                    format === f.id
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-sm'
                      : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'
                  )}
                >
                  <f.icon size={16} /> {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="bg-zinc-50/30 gap-3 border-t p-8 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px]"
          >
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || selectedCategories.length === 0}
            className="bg-zinc-950 hover:bg-zinc-800 shadow-premium h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Préparation...
              </>
            ) : (
              'Lancer l\'export'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
