"use client"

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, CheckCircle2, AlertCircle, ListChecks } from 'lucide-react';
import { pointageRapideQR } from '@/lib/server/pointage.actions';
import { toast } from 'sonner';

interface QRScannerProps {
  chantierId: string;
}

interface ScanSession {
  time: string;
  workerName: string;
  status: 'success' | 'already' | 'error';
}

export function QRScanner({ chantierId }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isOpen) {
      // Small delay to ensure the #reader element is in the DOM
      const timer = setTimeout(() => {
        const element = document.getElementById("reader");
        if (!element) return;

        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (isProcessing) return;

            if (decodedText.startsWith("gestibulder://worker/")) {
              const workerId = decodedText.split("/").pop();
              if (workerId) {
                handleScan(workerId);
              }
            } else {
              toast.error("Format QR Code invalide");
            }
          },
          () => {}
        ).catch(err => {
          console.error("Camera error:", err);
          // toast.error("Impossible d'accéder à la caméra");
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
      };
    }
  }, [isOpen]);

  const handleScan = async (workerId: string) => {
    setIsProcessing(true);
    try {
      const res = await pointageRapideQR(workerId, chantierId);
      const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      if (res.success) {
        setHistory(prev => [{ time, workerName: res.ouvrier!.nom_complet, status: 'success' }, ...prev]);
        setLastScan(res.ouvrier!.nom_complet);
        toast.success(`Pointage réussi: ${res.ouvrier!.nom_complet}`);
      } else if (res.alreadyPointed) {
        setHistory(prev => [{ time, workerName: "Ouvrier", status: 'already' }, ...prev]);
        toast.info("Déjà pointé aujourd'hui");
      }
    } catch (error) {
      toast.error("Erreur lors du scan");
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setLastScan(null);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center bg-muted/30 rounded-2xl">
        <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <Camera className="h-10 w-10 text-indigo-600" />
        </div>
        <h3 className="font-black text-xl uppercase mb-2">Scan QR Rapide</h3>
        <p className="text-muted-foreground text-sm max-w-xs mb-6 font-medium">
          Scannez les cartes des ouvriers pour enregistrer leur présence instantanément.
        </p>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 px-8 rounded-xl font-black uppercase tracking-wider"
        >
          Démarrer le scan
        </Button>
      </Card>

      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ListChecks className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Scans de la session</h4>
          </div>
          <div className="space-y-2">
            {history.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-xl animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground">{item.time}</span>
                  <span className="font-bold text-sm">{item.workerName}</span>
                </div>
                {item.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none h-[80vh] sm:h-auto" showCloseButton={false}>
          <div className="relative">
            <div id="reader" className="w-full"></div>

            {/* Overlay UI */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
              <div className="w-full flex justify-between items-center text-white">
                <h2 className="font-black text-lg uppercase tracking-wider">Scanner</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 pointer-events-auto"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-lg"></div>
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 animate-pulse rounded-lg">
                    <span className="text-white font-black text-sm uppercase">Traitement...</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-4">
                  Placez le QR Code au centre du carré
                </p>
                {lastScan && (
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-xs animate-bounce">
                    ✓ {lastScan} pointé
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
