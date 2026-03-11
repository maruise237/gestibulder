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
import { cn } from '@/lib/utils';
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

type ExportCategory = 'finances' | 'workers' | 'projects' | 'inventory';

interface ExportModalProps {
  trigger?: React.ReactNode;
}

export function ExportModal({ trigger }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ExportCategory[]>(['finances']);
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');

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
      const wb = XLSX.utils.book_new();

      if (selectedCategories.includes('workers')) {
        const { workers } = await getWorkers(1, 1000); // Get all
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

      // Generate file
      const wbout = XLSX.write(wb, { bookType: format, type: 'array' });
      const fileName = `export_gestibulder_${new Date().toISOString().split('T')[0]}.${format}`;
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, fileName);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="shadow-sm transition-all hover:bg-muted active:scale-95">
                <Download size={18} />
                <span className="sr-only">Exporter les données</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Exporter les données</TooltipContent>
        </Tooltip>
      )}
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[600px]">
        <DialogHeader className="bg-zinc-50/50 border-b p-8 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-zinc-950 text-white rounded-2xl p-3 shadow-lg">
              <Download size={24} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight">Configuration de l'Export</DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs font-bold tracking-widest uppercase">
                Choisissez les modules à inclure dans votre rapport
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 p-8 pt-6">
          {/* Categories Grid */}
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
                <span className="text-sm font-black tracking-tight text-zinc-900">{cat.label}</span>
                {selectedCategories.includes(cat.id as ExportCategory) && (
                  <div className="bg-indigo-600 text-white absolute top-3 right-3 rounded-full p-0.5">
                    <CheckCircle2 size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Format Selection */}
          <div className="space-y-4">
            <h3 className="text-zinc-400 text-[10px] font-black tracking-widest uppercase">Format de sortie</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setFormat('xlsx')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-3 rounded-xl border p-4 font-black transition-all',
                  format === 'xlsx'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-sm'
                    : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'
                )}
              >
                <FileSpreadsheet size={20} /> Excel (.xlsx)
              </button>
              <button
                onClick={() => setFormat('csv')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-3 rounded-xl border p-4 font-black transition-all',
                  format === 'csv'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-sm'
                    : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'
                )}
              >
                <FileText size={20} /> CSV (.csv)
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-zinc-50/30 gap-3 border-t p-8 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 h-12 flex-1 rounded-xl font-black uppercase tracking-widest"
          >
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || selectedCategories.length === 0}
            className="bg-zinc-950 hover:bg-zinc-800 shadow-premium h-12 flex-1 rounded-xl font-black uppercase tracking-widest"
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
