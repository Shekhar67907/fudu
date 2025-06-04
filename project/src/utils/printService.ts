import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PrescriptionData } from '../types';
import PrintablePrescription from '../components/Prescription/PrintablePrescription';
import PrintableCardPrescription from '../components/Prescription/PrintableCardPrescription';

/**
 * Print service for handling prescription printing
 */
export const printService = {
  /**
   * Prints a prescription in normal size format
   * @param data The prescription data to print
   * @param options Optional parameters including filename
   */
  printNormalSize: async (data: PrescriptionData, options: { filename?: string } = {}): Promise<void> => {
    // Create a temporary container for the print content
    const printContainer = document.createElement('div');
    printContainer.className = 'print-only';
    document.body.appendChild(printContainer);

    // Create custom styles for print layout
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-only, .print-only * {
          visibility: visible;
        }
        .print-only {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: A4;
          margin: 0.5cm;
          orphans: 0;
          widows: 0;
        }
        html, body {
          height: 99%;
          overflow: hidden;
        }
        /* Force single page */
        .print-container {
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          max-height: 27cm;
          overflow: hidden;
        }
        /* Hide other content */
        body > *:not(.print-only) {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    try {
      // Create a root for the print container
      const root = createRoot(printContainer);
      
      // Render the prescription component
      root.render(React.createElement(PrintablePrescription, { data }));
      
      // Wait for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }
      
      // Set the filename for the PDF download
      const filename = options.filename || 'drishtirx.pdf';
      
      // Create HTML for the print window
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename.replace(/\.pdf$/i, '')}</title>
            <style>
              @page { size: auto; margin: 0; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body onload="window.print();">
            ${printContainer.innerHTML}
            <script>
              // Set the PDF filename
              document.title = '${filename.replace(/\.pdf$/i, '')}';
              
              // For Chrome's print preview
              if (window.matchMedia) {
                window.matchMedia('print').addListener(function(evt) {
                  if (evt.matches) {
                    // Before print
                    document.title = '${filename.replace(/\.pdf$/i, '')}';
                  } else {
                    // After print
                    window.close();
                  }
                });
              }
              
              // For other browsers
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for the print dialog to close
      await new Promise<void>((resolve) => {
        const checkClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkClosed);
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      console.error('Error during printing:', error);
      alert('Failed to print. Please try again.');
      throw error;
    } finally {
      // Clean up
      if (document.body.contains(printContainer)) {
        const root = createRoot(printContainer);
        root.unmount();
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    }
  },

  /**
   * Prints a prescription in card size format
   * @param data The prescription data to print
   * @param options Optional parameters including filename
   */
  printCardSize: async (data: PrescriptionData, options: { filename?: string } = {}): Promise<void> => {
    // Create a temporary container for the print content
    const printContainer = document.createElement('div');
    printContainer.className = 'print-only';
    document.body.appendChild(printContainer);

    // Create custom styles for card size print layout
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-only, .print-only * {
          visibility: visible;
        }
        .print-only {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: 3.5in 2in;
          margin: 0.05in;
        }
        html, body {
          height: 100%;
          overflow: hidden;
        }
        /* Force single page */
        .card-print-container {
          page-break-inside: avoid;
          page-break-after: avoid;
          page-break-before: avoid;
        }
        /* Hide other content */
        body > *:not(.print-only) {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Create a root for the print container
    const root = createRoot(printContainer);
    
    // Render the card-sized printable component
    root.render(React.createElement(PrintableCardPrescription, { data }));
    
    // Wait for rendering to complete then print
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }
      
      // Set the filename for the PDF download
      const filename = options.filename || 'drishtirx.pdf';
      
      // Create a form to submit to the print window
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename.replace(/\.pdf$/i, '')}</title>
            <style>
              @page { size: auto; margin: 0; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body onload="window.print();">
            ${printContainer.innerHTML}
            <script>
              // Set the PDF filename
              document.title = '${filename.replace(/\.pdf$/i, '')}';
              
              // For Chrome's print preview
              if (window.matchMedia) {
                window.matchMedia('print').addListener(function(evt) {
                  if (evt.matches) {
                    // Before print
                    document.title = '${filename.replace(/\.pdf$/i, '')}';
                  } else {
                    // After print
                    window.close();
                  }
                });
              }
              
              // For other browsers
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for the print dialog to close
      await new Promise<void>((resolve) => {
        const checkClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkClosed);
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      console.error('Error during printing:', error);
      alert('Failed to print. Please try again.');
    } finally {
      // Clean up
      root.unmount();
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    }
  },

  /**
   * Prints a prescription in normal size with patient image
   * @param data The prescription data to print
   */
  printNormalSizeWithImage: async (data: PrescriptionData): Promise<void> => {
    // Create a temporary container for the print content
    const printContainer = document.createElement('div');
    printContainer.className = 'print-only';
    document.body.appendChild(printContainer);

    // Create custom styles for print layout with image
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-only, .print-only * {
          visibility: visible;
        }
        .print-only {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: A4;
          margin: 1cm;
        }
        .patient-image {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(styleElement);

    try {
      // Create a root for the print container
      const root = createRoot(printContainer);
      
      // Render the printable component (with showImage=true)
      root.render(React.createElement(PrintablePrescription, { data, showImage: true }));
      
      // Wait for rendering to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups for this site.');
      }
      
      // Create HTML for the print window
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${data.name || 'Prescription'}_${data.prescriptionNo || ''}</title>
            <style>
              @page { size: auto; margin: 0; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body onload="window.print();">
            ${printContainer.innerHTML}
            <script>
              // For Chrome's print preview
              if (window.matchMedia) {
                window.matchMedia('print').addListener(function(evt) {
                  if (!evt.matches) {
                    // After print
                    window.close();
                  }
                });
              }
              
              // For other browsers
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      
      // Wait for the print dialog to close
      await new Promise<void>((resolve) => {
        const checkClosed = setInterval(() => {
          if (printWindow.closed) {
            clearInterval(checkClosed);
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      console.error('Error during printing:', error);
      alert('Failed to print. Please try again.');
      throw error;
    } finally {
      // Clean up
      if (document.body.contains(printContainer)) {
        const root = createRoot(printContainer);
        root.unmount();
        document.body.removeChild(printContainer);
      }
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    }
  }
};
