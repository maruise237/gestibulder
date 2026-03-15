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
      width: 600,
      margin: 1,
      color: {
        dark: '#1e1b4b', // Indigo-950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H'
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Génère un PDF contenant les QR codes des ouvriers sélectionnés
 * Format carte d'identité professionnelle
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    if (i > 0) doc.addPage();

    // 1. Fond et cadre
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Bordure décorative
    doc.setDrawColor(79, 70, 229); // Indigo-600
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // 2. Logo / Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(30, 27, 75); // Indigo-950
    doc.text('GESTIBULDER', pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('CARTE D\'IDENTITÉ PROFESSIONNELLE', pageWidth / 2, 48, { align: 'center' });

    // 3. QR Code
    const qrDataUrl = await generateQRCodeDataURL(worker.id);
    const qrSize = 120;
    const xQr = (pageWidth - qrSize) / 2;
    const yQr = 70;

    // Ombre légère sous le QR (rectangle blanc)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(xQr - 5, yQr - 5, qrSize + 10, qrSize + 10, 3, 3, 'F');
    doc.addImage(qrDataUrl, 'PNG', xQr, yQr, qrSize, qrSize);

    // 4. Informations Ouvrier
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(worker.nom_complet.toUpperCase(), pageWidth / 2, yQr + qrSize + 30, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text(worker.metier.toUpperCase(), pageWidth / 2, yQr + qrSize + 45, { align: 'center' });

    // 5. Identifiant
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150);
    doc.text(`ID: ${worker.id.toUpperCase()}`, pageWidth / 2, yQr + qrSize + 65, { align: 'center' });

    // 6. Footer
    doc.setFillColor(30, 27, 75); // Indigo-950
    doc.rect(10, pageHeight - 30, pageWidth - 20, 20, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('GestiBulder · Le Pilotage de Chantier Intelligent', pageWidth / 2, pageHeight - 17, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('gestibulder.com', pageWidth / 2, pageHeight - 12, { align: 'center' });
  }

  return doc.output('datauristring');
}
