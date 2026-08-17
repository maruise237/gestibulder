"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileDown, CheckSquare, Square, Printer, Loader2 } from 'lucide-react';
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
            color: { dark: '#7a3a1f' }
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
            className="h-9 text-xs border-primary text-primary"
          >
            {selectedIds.length === workers.length ? (
              <><Square className="w-3.5 h-3.5 mr-2" /> Désélectionner</>
            ) : (
              <><CheckSquare className="w-3.5 h-3.5 mr-2" /> Tout sélectionner</>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} sélectionné(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
           <Button
            variant="ghost"
            size="sm"
            disabled={isGenerating || workers.length === 0}
            onClick={() => handleDownload(workers.map(w => w.id))}
            className="h-9 text-xs text-muted-foreground hover:text-foreground"
          >
            Tout exporter
          </Button>
          <Button
            size="sm"
            disabled={isGenerating || selectedIds.length === 0}
            onClick={() => handleDownload(selectedIds)}
            className="h-9 px-5 text-xs"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Printer className="w-3.5 h-3.5 mr-2" />}
            Imprimer sélection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {workers.map((worker) => (
          <Card
            key={worker.id}
            className={cn(
              "p-4 cursor-pointer transition-colors border",
              selectedIds.includes(worker.id)
                ? "border-primary bg-primary/5"
                : "hover:border-primary/40 bg-card border-border"
            )}
            onClick={() => toggleWorker(worker.id)}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.includes(worker.id)}
                onCheckedChange={() => toggleWorker(worker.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{worker.nom_complet}</p>
                <p className="text-xs text-muted-foreground truncate">{worker.metier}</p>
              </div>

              <div className="h-14 w-14 bg-card border border-border p-1 flex items-center justify-center overflow-hidden">
                {qrPreviews[worker.id] ? (
                  <img src={qrPreviews[worker.id]} alt="QR Preview" className="w-full h-full" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
