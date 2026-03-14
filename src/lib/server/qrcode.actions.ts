'use server';

import { createClient } from '@/lib/supabase/server';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { getAuthenticatedEnterpriseId } from './utils';

/**
 * Génère une data URL base64 d'un QR code pour un ouvrier
 */
export async function generateQRCodeDataURL(ouvrier_id: string): Promise<string> {
  const qrData = `gestibulder://worker/${ouvrier_id}`;
  try {
    const dataUrl = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Génère un PDF contenant les QR codes des ouvriers sélectionnés
 * Retourne une chaîne base64 (car les Blobs ne peuvent pas être retournés directement par des Server Actions)
 */
export async function generateQRCodesPDF(ouvrier_ids: string[]): Promise<string> {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) throw new Error(authError);

  const supabase = await createClient();

  const { data: workers, error } = await supabase
    .from('ouvriers')
    .select('id, nom_complet, metier')
    .in('id', ouvrier_ids)
    .eq('entreprise_id', entreprise_id);

  if (error || !workers) {
    throw new Error(error?.message || 'Workers not found');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    if (i > 0) doc.addPage();

    const qrDataUrl = await generateQRCodeDataURL(worker.id);

    // Centrer le QR code
    const pageWidth = doc.internal.pageSize.getWidth();
    const qrSize = 100;
    const x = (pageWidth - qrSize) / 2;
    const y = 50;

    doc.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);

    // Nom de l'ouvrier
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(worker.nom_complet.toUpperCase(), pageWidth / 2, y + qrSize + 20, { align: 'center' });

    // Métier
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(worker.metier, pageWidth / 2, y + qrSize + 32, { align: 'center' });

    // ID Court
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`ID: ${worker.id.substring(0, 6).toUpperCase()}`, pageWidth / 2, y + qrSize + 45, { align: 'center' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('GestiBulder · gestibulder.com', pageWidth / 2, 280, { align: 'center' });
  }

  return doc.output('datauristring');
}
