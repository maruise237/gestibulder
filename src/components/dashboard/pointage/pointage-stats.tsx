"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import { getPointagesStats } from '@/lib/server/pointage.actions';
import { PointageStats as PointageStatsType } from '@/types/pointage';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils';

interface PointageStatsProps {
  chantierId: string;
}

const MONTHS = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

export function PointageStats({ chantierId }: PointageStatsProps) {
  const [mois, setMois] = useState<string>(String(new Date().getMonth() + 1));
  const [annee, setAnnee] = useState<string>(String(new Date().getFullYear()));
  const [stats, setStats] = useState<PointageStatsType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [chantierId, mois, annee]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await getPointagesStats(chantierId, parseInt(mois), parseInt(annee));
      if (res.stats) {
        setStats(res.stats);
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error("Erreur lors du chargement des statistiques");
    } finally {
      setIsLoading(false);
    }
  };

  const exportExcel = () => {
    const data = stats.map(s => ({
      'Ouvrier': s.nom_complet,
      'Métier': s.metier,
      'Taux Journalier': s.taux_journalier,
      'Jours Présents': s.jours_present,
      'Demi-Journées': s.demi_journees,
      'Jours Absents': s.jours_absent,
      'Total Salaire (FCFA)': s.total_salaire
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stats Pointage");
    XLSX.writeFile(wb, `Stats_Pointage_${mois}_${annee}.xlsx`);
    toast.success("Excel généré avec succès");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const monthLabel = MONTHS.find(m => m.value === mois)?.label;

    doc.setFontSize(18);
    doc.text(`Rapport de Pointage - ${monthLabel} ${annee}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Ouvrier', 'Métier', 'P', 'D', 'A', 'Total Salaire']],
      body: stats.map(s => [
        s.nom_complet,
        s.metier,
        s.jours_present,
        s.demi_journees,
        s.jours_absent,
        `${s.total_salaire.toLocaleString()} FCFA`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Rapport_Pointage_${mois}_${annee}.pdf`);
    toast.success("PDF généré avec succès");
  };

  const totalMonth = stats.reduce((acc, curr) => acc + curr.total_salaire, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Mois</label>
            <Select value={mois} onValueChange={(val) => val && setMois(val)}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl font-bold">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Année</label>
            <Select value={annee} onValueChange={(val) => val && setAnnee(val)}>
              <SelectTrigger className="w-[120px] h-10 rounded-xl font-bold">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={exportExcel}
            className="flex-1 md:flex-none h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-indigo-200 text-indigo-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-2" /> Excel
          </Button>
          <Button
            variant="outline"
            onClick={exportPDF}
            className="flex-1 md:flex-none h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-indigo-200 text-indigo-700"
          >
            <FileText className="w-3.5 h-3.5 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 rounded-2xl border-l-8 border-indigo-600 bg-indigo-50/20">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Salaire Mensuel</p>
          <p className="text-2xl font-black text-indigo-950">{totalMonth.toLocaleString()} <span className="text-xs">FCFA</span></p>
          <TrendingUp className="w-8 h-8 text-indigo-200 absolute right-6 bottom-6" />
        </Card>

        <Card className="p-6 rounded-2xl border-l-8 border-emerald-600 bg-emerald-50/20">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Effectif Concerné</p>
          <p className="text-2xl font-black text-emerald-950">{stats.length} <span className="text-xs">Ouvriers</span></p>
          <Users className="w-8 h-8 text-emerald-200 absolute right-6 bottom-6" />
        </Card>

        <Card className="p-6 rounded-2xl border-l-8 border-amber-600 bg-amber-50/20">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Période</p>
          <p className="text-2xl font-black text-amber-950">{MONTHS.find(m => m.value === mois)?.label} {annee}</p>
          <Calendar className="w-8 h-8 text-amber-200 absolute right-6 bottom-6" />
        </Card>
      </div>

      <Card className="rounded-2xl border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Ouvrier</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Présent (P)</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Demi (D)</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-center">Absent (A)</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest text-right">Total Salaire</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                    <span className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Chargement...</span>
                  </TableCell>
                </TableRow>
              ) : stats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-bold uppercase text-xs">
                    Aucune donnée pour cette période
                  </TableCell>
                </TableRow>
              ) : (
                stats.map((s) => (
                  <TableRow key={s.ouvrier_id} className="hover:bg-muted/30">
                    <TableCell>
                      <p className="font-black text-sm uppercase">{s.nom_complet}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.metier}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-black h-7 w-7 flex items-center justify-center p-0 rounded-full">{s.jours_present}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-black h-7 w-7 flex items-center justify-center p-0 rounded-full">{s.demi_journees}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-rose-100 text-rose-700 font-black h-7 w-7 flex items-center justify-center p-0 rounded-full">{s.jours_absent}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-indigo-600">
                      {s.total_salaire.toLocaleString()} <span className="text-[10px]">FCFA</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
