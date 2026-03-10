'use client';

import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  HardHat,
  Users,
  Calculator,
  Package,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getProjects } from '@/lib/server/project.actions';
import { getWorkers } from '@/lib/server/worker.actions';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type ExportCategory = 'projects' | 'workers' | 'stocks' | 'equipment' | 'finances';

export function ExportModal({ trigger }: { trigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<ExportCategory[]>([]);
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { id: 'projects', label: 'Chantiers', icon: HardHat },
    { id: 'workers', label: 'Personnel', icon: Users },
    { id: 'stocks', label: 'Stocks', icon: Package },
    { id: 'equipment', label: 'Équipements', icon: Truck },
    { id: 'finances', label: 'Finances', icon: Calculator },
  ];

  const toggleCategory = (id: ExportCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const workbook = XLSX.utils.book_new();

      if (selectedCategories.includes('projects')) {
        const res = await getProjects();
        const data = res.projects?.map(p => ({
          Nom: p.nom,
          Adresse: p.adresse,
          Statut: p.statut,
          'Budget Total': p.budget_total,
          'Avancement (%)': p.avancement_pct
        })) || [];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), 'Chantiers');
      }

      if (selectedCategories.includes('workers')) {
        const res = await getWorkers(1, 1000);
        const data = res.workers?.map(w => ({
          Nom: w.nom_complet,
          Téléphone: w.telephone,
          Métier: w.metier_specialise,
          'Type Paiement': w.type_paiement,
          'Taux Journalier': w.taux_journalier,
          Statut: w.actif ? 'Actif' : 'Inactif'
        })) || [];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), 'Personnel');
      }

      const excelBuffer = XLSX.write(workbook, { bookType: format, type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `GestiBulder_Export_${new Date().toISOString().split('T')[0]}.${format}`);
      
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exporter les données</DialogTitle>
          <DialogDescription>
            Sélectionnez les modules à inclure dans votre rapport.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategories.includes(cat.id as ExportCategory) ? 'secondary' : 'outline'}
                className="h-20 flex-col gap-2 relative"
                onClick={() => toggleCategory(cat.id as ExportCategory)}
              >
                <cat.icon className="h-5 w-5" />
                <span className="text-xs">{cat.label}</span>
                {selectedCategories.includes(cat.id as ExportCategory) && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                )}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format de sortie</label>
            <div className="flex gap-2">
              <Button
                variant={format === 'xlsx' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormat('xlsx')}
              >
                Excel (.xlsx)
              </Button>
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setFormat('csv')}
              >
                CSV (.csv)
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || selectedCategories.length === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lancer l'export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
