"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileDown, Users, CheckSquare, Square, Printer, Loader2 } from 'lucide-react';
import { generateQRCodesPDF } from '@/lib/server/qrcode.actions';
import { toast } from 'sonner';

interface QRGeneratorProps {
  workers: any[];
}

export function QRGenerator({ workers }: QRGeneratorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
      // Télécharger le PDF
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `QR_Codes_Ouvriers_${new Date().toLocaleDateString()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF généré avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="rounded-lg h-9 font-bold text-[10px] uppercase tracking-wider"
          >
            {selectedIds.length === workers.length ? (
              <><Square className="w-3 h-3 mr-2" /> Tout désélectionner</>
            ) : (
              <><CheckSquare className="w-3 h-3 mr-2" /> Tout sélectionner</>
            )}
          </Button>
          <Badge variant="secondary" className="font-bold">{selectedIds.length} sélectionné(s)</Badge>
        </div>

        <div className="flex items-center gap-2">
           <Button
            variant="outline"
            size="sm"
            disabled={isGenerating || workers.length === 0}
            onClick={() => handleDownload(workers.map(w => w.id))}
            className="rounded-lg h-9 font-bold text-[10px] uppercase tracking-wider"
          >
            Exporter TOUS
          </Button>
          <Button
            size="sm"
            disabled={isGenerating || selectedIds.length === 0}
            onClick={() => handleDownload(selectedIds)}
            className="rounded-lg h-9 font-bold text-[10px] uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700"
          >
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Printer className="w-3 h-3 mr-2" />}
            Imprimer sélection
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workers.map((worker) => (
          <Card
            key={worker.id}
            className={cn(
              "p-4 cursor-pointer transition-all border-2",
              selectedIds.includes(worker.id) ? "border-indigo-600 bg-indigo-50/30" : "hover:border-indigo-200"
            )}
            onClick={() => toggleWorker(worker.id)}
          >
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedIds.includes(worker.id)}
                onCheckedChange={() => toggleWorker(worker.id)}
                className="rounded-md h-5 w-5"
              />
              <div className="flex-1">
                <p className="font-black text-sm uppercase text-foreground">{worker.nom_complet}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{worker.metier}</p>
              </div>
              <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                <FileDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
