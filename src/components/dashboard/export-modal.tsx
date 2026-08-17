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
import { generateReportId } from '@/lib/utils/report-id';
import { label, EXPENSE_CATEGORY_LABELS } from '@/lib/labels';

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
    { id: 'finances', label: 'Finances & Dépenses', icon: TrendingUp },
    { id: 'workers', label: 'Main d\'œuvre', icon: Users },
    { id: 'projects', label: 'Liste des Chantiers', icon: HardHat },
    { id: 'inventory', label: 'Stocks & Matériaux', icon: Package },
  ];

  const toggleCategory = (id: ExportCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsLoading(true);
    const reportId = generateReportId();
    try {
      if (format === 'pdf') {
        await handlePdfExport(reportId);
      } else {
        await handleExcelCsvExport(reportId);
      }
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfExport = async (reportId: string) => {
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

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
            label(EXPENSE_CATEGORY_LABELS, e.categorie),
            new Date(e.date_operation).toLocaleDateString(),
            formatCurrency(e.montant, enterprise?.devise)
          ]),
          theme: 'striped',
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(
          `GestiBulder · gestibulder.com · ID: ${reportId} · Page ${i}/${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    }

    doc.save(`rapport_gestibulder_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExcelCsvExport = async (reportId: string) => {
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

    // Ajouter une feuille "Certification"
    const certData = [{
      'Document': 'Rapport GestiBulder',
      'Identifiant': reportId,
      'Généré le': new Date().toLocaleString('fr-FR'),
      'Entreprise': enterprise?.nom || '',
      'Vérification': `https://gestibulder.com/verifier?id=${reportId}`,
      'Logiciel': 'GestiBulder — gestibulder.com',
    }];
    const wsCert = XLSX.utils.json_to_sheet(certData);
    XLSX.utils.book_append_sheet(wb, wsCert, 'Certification');

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
              <Button variant="outline" size="icon" className="h-9 w-9 border-border">
                <Download size={18} />
                <span className="sr-only">Exporter les données</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Exporter les données</TooltipContent>
        </Tooltip>
      )}
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[600px]">
        <DialogHeader className="border-b p-8 pb-6">
          <DialogTitle className="font-display text-2xl font-medium">Configuration de l'export</DialogTitle>
          <DialogDescription className="text-xs">
            Choisissez les modules à inclure dans votre rapport
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 p-8 pt-6">
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                type="button"
                variant="outline"
                onClick={() => toggleCategory(cat.id as ExportCategory)}
                className={cn(
                  'relative flex h-auto flex-col items-start gap-2 border p-4',
                  selectedCategories.includes(cat.id as ExportCategory)
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40'
                )}
              >
                <cat.icon size={18} className="text-muted-foreground" />
                <span className="text-size-sm font-medium text-foreground">{cat.label}</span>
                {selectedCategories.includes(cat.id as ExportCategory) && (
                  <div className="bg-primary text-primary-foreground absolute top-3 right-3 rounded-full p-0.5">
                    <CheckCircle2 size={14} strokeWidth={3} />
                  </div>
                )}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs text-muted-foreground">Format de sortie</h3>
            <div className="flex gap-2">
              {[
                { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet },
                { id: 'csv', label: 'CSV', icon: FileText },
                { id: 'pdf', label: 'PDF', icon: FileText }
              ].map(f => (
                <Button
                  key={f.id}
                  type="button"
                  variant="outline"
                  onClick={() => setFormat(f.id as any)}
                  className={cn(
                    'h-auto flex-1 gap-2 border p-3 text-xs font-medium',
                    format === f.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <f.icon size={16} /> {f.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 border-t p-8 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || selectedCategories.length === 0}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Préparation...
              </>
            ) : (
              "Lancer l'export"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
