import * as React from 'react';
import { createRoot } from 'react-dom/client';
import OrderCard from '../components/Order/OrderCard';

export interface OrderItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface OrderCardData {
  orderNumber: string;
  customerName: string;
  bookingDate: Date;
  deliveryDate: Date;
  estimateAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  items: OrderItem[];
  remarks?: string;
}

export const printOrderCard = (orderData: OrderCardData) => {
  try {
    // Create a container for the print content
    const printContainer = document.createElement('div');
    printContainer.id = 'print-order-card';
    document.body.appendChild(printContainer);

    // Use React 18's createRoot API
    const root = createRoot(printContainer);
    
    // Render the OrderCard component
    root.render(React.createElement(OrderCard, orderData));
    
    // Wait for the component to render
    setTimeout(() => {
      // Get the HTML content
      const printContent = document.getElementById('print-order-card')?.innerHTML;
      
      if (!printContent) {
        console.error('Failed to generate print content');
        document.body.removeChild(printContainer);
        return;
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('Failed to open print window. Please allow popups for this site.');
        document.body.removeChild(printContainer);
        alert('Please allow popups to print the order card.');
        return;
      }

      // Write the content to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Order Card - ${orderData.orderNumber}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              @page { 
                size: auto; 
                margin: 0mm; 
              }
              body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .order-card {
                width: 80mm;
                margin: 0 auto;
                padding: 10px;
              }
              @media print {
                body * {
                  visibility: hidden;
                }
                .order-card, .order-card * {
                  visibility: visible;
                }
                .order-card {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 10px;
                }
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="order-card">${printContent}</div>
            <script>
              // Wait for all content to load
              window.onload = function() {
                // Small delay to ensure everything is rendered
                setTimeout(function() {
                  // Focus the window (might help with some browsers)
                  window.focus();
                  // Trigger print
                  window.print();
                  // Close after printing
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 300);
              };
            </script>
          </body>
        </html>
      `);

      // Close the document
      printWindow.document.close();

      // Clean up
      document.body.removeChild(printContainer);
      
      // Try to force focus (might help with some browsers)
      if (printWindow.focus) {
        printWindow.focus();
      }
      
    }, 300); // Increased timeout to ensure component is rendered
  } catch (error) {
    console.error('Error generating print content:', error);
    alert('Failed to generate print preview. Please try again.');
  }
};
