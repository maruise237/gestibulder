'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Users,
  HardHat,
  Wallet,
  Package,
  Calendar,
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
import { exportDashboardData } from '@/lib/server/dashboard.actions';

type ExportCategory = 'projects' | 'workers' | 'expenses' | 'stock' | 'attendance';

const categories = [
  { id: 'projects', label: 'Chantiers', icon: HardHat, color: 'bg-blue-50 text-blue-600' },
  { id: 'workers', label: 'Ouvriers', icon: Users, color: 'bg-amber-50 text-amber-600' },
  { id: 'expenses', label: 'Dépenses', icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'stock', label: 'Stocks', icon: Package, color: 'bg-purple-50 text-purple-600' },
  { id: 'attendance', label: 'Pointages', icon: Calendar, color: 'bg-rose-50 text-rose-600' },
];

export function ExportModal({ trigger }: { trigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ExportCategory[]>(['projects']);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

  const toggleCategory = (id: ExportCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await exportDashboardData(selectedCategories, format);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary text-primary-foreground rounded-md p-2">
              <Download size={20} />
            </div>
            <div className="space-y-1">
              <DialogTitle>Configuration de l&apos;Export</DialogTitle>
              <DialogDescription>
                Choisissez les modules à inclure dans votre rapport
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id as ExportCategory)}
                    className={cn(
                      'group relative flex flex-col items-center gap-3 rounded-lg border p-4 transition-all',
                      selectedCategories.includes(cat.id as ExportCategory)
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-background hover:bg-muted/50'
                    )}
                  >
                    <div className={cn('rounded-md p-2 transition-transform group-hover:scale-110', cat.color)}>
                      <cat.icon size={18} />
                    </div>
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">{cat.label}</span>
                    {selectedCategories.includes(cat.id as ExportCategory) && (
                      <div className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full p-0.5">
                        <CheckCircle2 size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">Format de sortie</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormat('xlsx')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-3 rounded-md border p-3 text-sm font-medium transition-all',
                      format === 'xlsx'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <FileSpreadsheet size={18} /> Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => setFormat('csv')}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-3 rounded-md border p-3 text-sm font-medium transition-all',
                      format === 'csv'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <FileText size={18} /> CSV (.csv)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6">
            <Button
              variant="outline"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
