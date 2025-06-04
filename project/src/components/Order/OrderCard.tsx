import React from 'react';
import { format } from 'date-fns';

interface OrderItem {
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

interface OrderCardProps {
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

const OrderCard: React.FC<OrderCardProps> = ({
  orderNumber,
  customerName,
  bookingDate,
  deliveryDate,
  estimateAmount,
  advanceAmount,
  balanceAmount,
  items,
  remarks = ''
}) => {
  const currentDate = format(new Date(), 'dd/MM/yyyy hh:mm a');
  
  return (
    <div className="order-card p-2 w-full max-w-xs mx-auto bg-white">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-base font-bold uppercase">Lucky Opticians</h1>
        <p className="text-xs">A.V. Building, In front of Biroba Temple, Near S.T. Stand, Karad.</p>
        <p className="text-xs">Mob No.: 9922637944</p>
      </div>

      <hr className="border-t border-dashed border-black my-1" />

      {/* Order Info */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <div>Order No: <span className="font-semibold">{orderNumber}</span></div>
          <div>Date: <span className="font-semibold">{format(bookingDate, 'dd/MM/yyyy')}</span></div>
        </div>
        <div className="text-xs mb-2">Customer Name: <span className="font-semibold">{customerName}</span></div>
        
        {/* Items Table */}
        <table className="w-full border-collapse border border-black mb-2 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-left">Description</th>
              <th className="border border-black p-1 w-10 text-center">Qty</th>
              <th className="border border-black p-1 w-14 text-right">Rate</th>
              <th className="border border-black p-1 w-14 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td className="border border-black p-1">{item.description}</td>
                <td className="border border-black p-1 text-center">{item.qty}</td>
                <td className="border border-black p-1 text-right">{item.rate.toFixed(2)}</td>
                <td className="border border-black p-1 text-right">{item.amount.toFixed(2)}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr>
              <td colSpan={3} className="border border-black p-1 text-right font-semibold">Total</td>
              <td className="border border-black p-1 text-right font-semibold">₹{estimateAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* Amount Details */}
        <div className="grid grid-cols-1 gap-1 mb-2 text-xs">
          <div className="flex justify-between">
            <span>Estimate Amount:</span>
            <span className="font-semibold">₹{estimateAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Advance Amount:</span>
            <span className="font-semibold">₹{advanceAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance Amount:</span>
            <span className="font-semibold">₹{balanceAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-1 mb-2 text-xs">
          <div className="flex justify-between">
            <span>Booking Date/Time:</span>
            <span className="font-semibold">{format(bookingDate, 'dd/MM/yyyy hh:mm a')}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Date/Time:</span>
            <span className="font-semibold">{format(deliveryDate, 'dd/MM/yyyy hh:mm a')}</span>
          </div>
        </div>

        {/* Remarks */}
        {remarks && (
          <div className="mb-2 text-xs">
            <div className="font-semibold">Remarks:</div>
            <div>{remarks}</div>
          </div>
        )}
      </div>

      <hr className="border-t border-dashed border-black my-1" />

      {/* Footer */}
      <div className="text-center text-xs mt-1">
        <p className="font-semibold">Thank you for your business!</p>
        <p className="text-2xs mt-1 text-gray-600">Printed on: {currentDate}</p>
      </div>

      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @page {
            size: 80mm auto;
            margin: 0;
            padding: 0;
          }
          @media print {
            body {
              width: 80mm;
              margin: 0 auto;
              padding: 2mm;
            }
            .order-card {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 2mm !important;
              font-size: 9pt !important;
              line-height: 1.2 !important;
            }
            .order-card * {
              font-size: inherit !important;
              line-height: inherit !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default OrderCard;
