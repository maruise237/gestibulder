"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileDown, Users, CheckSquare, Square, Printer, Loader2 } from 'lucide-react';
import { generateQRCodesPDF } from '@/lib/server/qrcode.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  workers: any[];
}

export function QRGenerator({ workers }: QRGeneratorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const generatePreviews = async () => {
      const previews: Record<string, string> = {};
      for (const worker of workers) {
        try {
          const url = await QRCode.toDataURL(`gestibulder://worker/${worker.id}`, {
            width: 120,
            margin: 1,
            color: { dark: '#1e1b4b' }
          });
          previews[worker.id] = url;
        } catch (e) {
          console.error(e);
        }
      }
      setQrPreviews(previews);
    };
    if (workers.length > 0) generatePreviews();
  }, [workers]);

  const toggleWorker = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === workers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(workers.map(w => w.id));
    }
  };

  const handleDownload = async (ids: string[]) => {
    if (ids.length === 0) {
      toast.error("Veuillez sélectionner au moins un ouvrier");
      return;
    }

    setIsGenerating(true);
    try {
      const dataUri = await generateQRCodesPDF(ids);
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `Cartes_QR_Ouvriers_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF généré avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest border-indigo-200"
          >
            {selectedIds.length === workers.length ? (
              <><Square className="w-3.5 h-3.5 mr-2" /> Désélectionner</>
            ) : (
              <><CheckSquare className="w-3.5 h-3.5 mr-2" /> Tout sélectionner</>
            )}
          </Button>
          <Badge variant="secondary" className="font-black text-[10px] uppercase py-1.5 px-3 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg">
            {selectedIds.length} sélectionné(s)
          </Badge>
        </div>

        <div className="flex items-center gap-2">
           <Button
            variant="ghost"
            size="sm"
            disabled={isGenerating || workers.length === 0}
            onClick={() => handleDownload(workers.map(w => w.id))}
            className="rounded-xl h-10 font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Tout exporter
          </Button>
          <Button
            size="sm"
            disabled={isGenerating || selectedIds.length === 0}
            onClick={() => handleDownload(selectedIds)}
            className="rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Printer className="w-3.5 h-3.5 mr-2" />}
            Imprimer sélection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => (
          <Card
            key={worker.id}
            className={cn(
              "p-4 cursor-pointer transition-all duration-300 border-2 rounded-2xl group relative overflow-hidden",
              selectedIds.includes(worker.id)
                ? "border-indigo-600 bg-indigo-50/40 shadow-md"
                : "hover:border-indigo-200 bg-card border-border shadow-sm"
            )}
            onClick={() => toggleWorker(worker.id)}
          >
            <div className="flex items-center gap-4 relative z-10">
              <Checkbox
                checked={selectedIds.includes(worker.id)}
                onCheckedChange={() => toggleWorker(worker.id)}
                className="rounded-md h-5 w-5 border-indigo-300 data-[state=checked]:bg-indigo-600"
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm uppercase text-foreground truncate">{worker.nom_complet}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{worker.metier}</p>
              </div>

              <div className="h-14 w-14 bg-white border border-indigo-100 rounded-xl p-1 shadow-inner flex items-center justify-center overflow-hidden">
                {qrPreviews[worker.id] ? (
                  <img src={qrPreviews[worker.id]} alt="QR Preview" className="w-full h-full" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                )}
              </div>
            </div>

            {/* Background design element */}
            <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
               <Users className="w-16 h-16 text-indigo-900" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
