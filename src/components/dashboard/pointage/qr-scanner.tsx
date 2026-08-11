"use client"

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/empty-state';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Camera, X, CheckCircle2, AlertCircle, ListChecks, UserCheck } from 'lucide-react';
import { pointageRapideQR } from '@/lib/server/pointage.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [lastScanResult, setLastScanResult] = useState<{ name: string; time: string; already: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;

    if (isOpen && !lastScanResult) {
      const timer = setTimeout(() => {
        const element = document.getElementById("reader");
        if (!element) return;

        html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
          },
          async (decodedText) => {
            if (isProcessing) return;

            if (decodedText.startsWith("gestibulder://worker/")) {
              const workerId = decodedText.split("/").pop();
              if (workerId) {
                // Stopper le scanner temporairement pour éviter les scans multiples
                if (scannerRef.current?.isScanning) {
                   await scannerRef.current.pause(true);
                }
                handleScan(workerId);
              }
            } else {
              toast.error("Format QR Code invalide");
            }
          },
          () => {}
        ).catch(err => {
          console.error("Camera error:", err);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current?.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
      };
    }
  }, [isOpen, lastScanResult, isProcessing]);

  const handleScan = async (workerId: string) => {
    setIsProcessing(true);
    try {
      const res = await pointageRapideQR(workerId, chantierId);

      if (res.error) {
        toast.error(res.error);
        if (scannerRef.current) {
          scannerRef.current.resume();
        }
        setIsProcessing(false);
        return;
      }

      const name = res.ouvrier?.nom_complet || "Ouvrier";
      const time = res.heure_arrivee || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      if (res.success || res.alreadyPointed) {
        setHistory(prev => [
          { time, workerName: name, status: res.success ? 'success' : 'already' },
          ...prev
        ]);
        setLastScanResult({ name, time, already: !!res.alreadyPointed });

        // Auto-dismiss after 2 seconds for continuous scanning
        setTimeout(() => {
          setLastScanResult(null);
          setIsProcessing(false);
          // Le scanner redémarrera via useEffect
        }, 2000);
      }
    } catch (error) {
      toast.error("Erreur lors du scan");
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <EmptyState
          icon={Camera}
          title="Scan QR rapide"
          description="Scannez les cartes des ouvriers pour enregistrer leur présence instantanément."
          action={
            <Button onClick={() => setIsOpen(true)}>
              Démarrer le scan
            </Button>
          }
        />
      </Card>

      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ListChecks className="w-4 h-4" />
            <h4 className="text-[10px] font-black">Scans de la session</h4>
          </div>
          <div className="space-y-2">
            {history.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-card border rounded-xl animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground">{item.time}</span>
                  <span className="font-bold text-sm">{item.workerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-black tracking-tighter",
                    item.status === 'success' ? "text-success" : "text-warning"
                  )}>
                    {item.status === 'success' ? "Pointé" : "Déjà pointé"}
                  </span>
                  {item.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(v) => !v && setIsOpen(false)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none h-[80vh] sm:h-auto" showCloseButton={false}>
          <div className="relative h-full min-h-[400px]">
            <div id="reader" className="w-full"></div>

            {/* Camera Overlay */}
            {!lastScanResult && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
                <div className="w-full flex justify-between items-center text-white">
                  <h2 className="font-black text-lg tracking-wider">Scanner</h2>
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
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 animate-pulse rounded-lg">
                      <span className="text-white font-black text-sm">Traitement...</span>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-white/70 text-[10px] font-bold mb-4">
                    Placez le QR Code au centre du carré
                  </p>
                </div>
              </div>
            )}

            {/* Success/Already Result Overlay */}
            {lastScanResult && (
              <div className="absolute inset-0 bg-card flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className={cn(
                  "h-24 w-24 rounded-full flex items-center justify-center mb-6",
                  lastScanResult.already ? "bg-warning/10" : "bg-success/10"
                )}>
                  {lastScanResult.already ? (
                    <AlertCircle className="h-12 w-12 text-warning" />
                  ) : (
                    <UserCheck className="h-12 w-12 text-success" />
                  )}
                </div>

                <h2 className="text-2xl font-black mb-1">{lastScanResult.name}</h2>
                <p className="text-muted-foreground font-bold mb-4 text-xs">
                  {lastScanResult.already ? "DÉJÀ POINTÉ À" : "POINTÉ AVEC SUCCÈS À"} {lastScanResult.time}
                </p>

                <div className="h-1 bg-muted w-32 rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-progress origin-left"></div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
