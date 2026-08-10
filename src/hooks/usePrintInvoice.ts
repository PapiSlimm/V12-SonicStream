import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { createElement } from 'react';
import { PrintInvoicePDF } from '../components/printing/PrintInvoicePDF';

export const generateInvoicePDF = async (order: any) => {
  try {
    // pdf() expects a Document element. PrintInvoicePDF returns a Document.
    // Casting to any to bypass strict ReactElement<DocumentProps> requirement
    const blob = await pdf(createElement(PrintInvoicePDF, { order }) as any).toBlob();
    saveAs(blob, `invoice-${order.id}.pdf`);
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert('Failed to generate PDF invoice. Please try again.');
  }
};

export const emailInvoicePDF = async (orderId: string, email: string) => {
  try {
    const response = await fetch('/api/printing/invoice-email', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ orderId, email }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    alert(`Invoice sent to ${email}`);
  } catch (error) {
    console.error('Failed to email invoice:', error);
    alert('Failed to email invoice. Please try again.');
  }
};
