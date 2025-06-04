import React from 'react';
import { PrescriptionData } from '../../types';
import { format } from 'date-fns';

// Import a placeholder image for the patient photo if needed
// import placeholderImage from '../../assets/placeholder-profile.png';

// Add print-specific styles
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 0.8cm;
      orphans: 0;
      widows: 0;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      font-size: 9pt;
      line-height: 1.2;
      height: 100%;
      page-break-after: avoid;
      page-break-before: avoid;
      page-break-inside: avoid;
    }
    html {
      height: 100%;
      page-break-after: avoid;
      page-break-before: avoid;
      page-break-inside: avoid;
    }
    .print-container {
      padding: 5mm 15mm 5mm 15mm;
      width: 210mm;
      max-height: 280mm;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      page-break-after: avoid;
      page-break-inside: avoid;
    }
    .no-print {
      display: none !important;
    }
    .header {
      text-align: center;
      margin-bottom: 6mm;
    }
    .header h2 {
      margin: 0 0 1mm 0;
      font-size: 12pt;
      font-weight: bold;
    }
    .header p {
      margin: 0;
      font-size: 9pt;
      line-height: 1.2;
    }
    .customer-info {
      display: grid;
      grid-template-columns: auto 1fr auto 1fr;
      column-gap: 5mm;
      row-gap: 2mm;
      margin-bottom: 6mm;
      width: 100%;
    }
    .customer-info .label {
      font-weight: bold;
      white-space: nowrap;
      min-width: 30mm;
      padding-right: 1mm;
      text-align: right;
    }
    .customer-info .value {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .address-row {
      grid-column: 1 / span 4;
      display: grid;
      grid-template-columns: auto 1fr;
    }
    .address-row .value {
      white-space: normal; /* Allow address to wrap */
    }
    .single-row {
      grid-column: 1 / span 4;
      display: grid;
      grid-template-columns: auto 1fr;
    }
    .prescription-table-container {
      position: relative;
      margin-bottom: 5mm;
    }
    .prescription-table {
      width: calc(100% - 12mm);
      margin-left: 12mm;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .prescription-table th {
      border: 1px solid #777;
      padding: 1.5mm;
      text-align: center;
      font-weight: bold;
      font-size: 9pt;
      background-color: #f5f5f5;
    }
    .prescription-table td {
      border: 1px solid #777;
      padding: 1.5mm;
      text-align: center;
      font-size: 9pt;
    }
    .prescription-table tr.section-header th {
      border-bottom: 2px solid #555;
    }
    .row-labels {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
    }
    .row-label {
      position: absolute;
      left: 0;
      font-weight: bold;
      display: flex;
      align-items: center;
      padding-right: 2mm;
      text-align: right;
      width: 10mm;
      height: 5.2mm; /* Same as table row height */
    }
    .row-label.dv {
      top: 14.8mm; /* Align with first data row - center aligned */
    }
    .row-label.nv {
      top: 23.4mm; /* Align with second data row - center aligned */
    }
    .rpd-lpd-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6mm;
      padding-left: 12mm;
      padding-right: 12mm;
    }
    .rpd-lpd-section {
      width: 48%;
    }
    .rpd-lpd-section .label {
      font-weight: bold;
      margin-right: 1mm;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 10mm;
      align-items: flex-end;
    }
    .footer .label {
      font-weight: bold;
      margin-right: 1mm;
    }
    .thanks-message {
      text-align: center;
      font-weight: bold;
      margin-top: 10mm;
    }
  }
`;

interface PrintablePrescriptionProps {
  data: PrescriptionData;
  showImage?: boolean;
}

const PrintablePrescription: React.FC<PrintablePrescriptionProps> = ({ data, showImage = false }) => {
  // Format date in short format
  const shortFormattedDate = data.date ? format(new Date(data.date), 'dd-MMM-yyyy') : format(new Date(), 'dd-MMM-yyyy');
  const retestDate = data.retestAfter ? format(new Date(data.retestAfter), 'dd/MM/yyyy') : '';

  return (
    <div className="print-container">
      <style>{printStyles}</style>
      
      {/* Clinic Header */}
      <div className="header">
        <h2>Lucky Opticians</h2>
        <p>A.V. Building, In front of Biroba Temple, Near S.T. Stand, Karad.</p>
        <p>Mob No.: 9922637944</p>
      </div>
      
      {/* Customer Info - Grid layout with perfect alignment */}
      <div className="customer-info">
        <div className="label">Customer Name :</div>
        <div className="value">{data.name}</div>
        <div className="label">Prescription No :</div>
        <div className="value">{data.prescriptionNo}</div>
        
        <div className="address-row">
          <div className="label">Address :</div>
          <div className="value">{data.address}</div>
        </div>
        
        <div className="label">City :</div>
        <div className="value">{data.city}</div>
        <div className="label">Pin :</div>
        <div className="value">{data.pinCode}</div>
        
        <div className="label">Date :</div>
        <div className="value">{shortFormattedDate}</div>
        <div className="label">Prescribed By :</div>
        <div className="value">{data.prescribedBy}</div>
        
        <div className="single-row">
          <div className="label">IPD :</div>
          <div className="value">{data.ipd}</div>
        </div>
        
        {showImage && (
          <div style={{ position: 'absolute', right: '15mm', top: '25mm' }}>
            <img 
              src={(data as any).photoUrl || '/placeholder-profile.png'} 
              alt="Patient" 
              style={{ width: '25mm', height: '30mm', border: '1px solid #ddd' }}
            />
          </div>
        )}
      </div>
      
      {/* Prescription Table with perfectly aligned row labels */}
      <div className="prescription-table-container">
        <table className="prescription-table">
          <thead>
            <tr className="section-header">
              <th colSpan={5}>RIGHT</th>
              <th colSpan={5}>LEFT</th>
            </tr>
            <tr>
              <th>SPH</th>
              <th>CYL</th>
              <th>AXIS</th>
              <th>ADD</th>
              <th>Vn</th>
              <th>SPH</th>
              <th>CYL</th>
              <th>AXIS</th>
              <th>ADD</th>
              <th>Vn</th>
            </tr>
          </thead>
          <tbody>
            {/* D.V. Row */}
            <tr>
              <td>{data.rightEye.dv.sph}</td>
              <td>{data.rightEye.dv.cyl}</td>
              <td>{data.rightEye.dv.ax}</td>
              <td>{data.rightEye.dv.add}</td>
              <td>{data.rightEye.dv.vn}</td>
              <td>{data.leftEye.dv.sph}</td>
              <td>{data.leftEye.dv.cyl}</td>
              <td>{data.leftEye.dv.ax}</td>
              <td>{data.leftEye.dv.add}</td>
              <td>{data.leftEye.dv.vn}</td>
            </tr>
            
            {/* N.V. Row */}
            <tr>
              <td>{data.rightEye.nv.sph}</td>
              <td>{data.rightEye.nv.cyl}</td>
              <td>{data.rightEye.nv.ax}</td>
              <td>{data.rightEye.nv.add}</td>
              <td>{data.rightEye.nv.vn}</td>
              <td>{data.leftEye.nv.sph}</td>
              <td>{data.leftEye.nv.cyl}</td>
              <td>{data.leftEye.nv.ax}</td>
              <td>{data.leftEye.nv.add}</td>
              <td>{data.leftEye.nv.vn}</td>
            </tr>
          </tbody>
        </table>
        
        {/* D.V./N.V. Row labels with absolute positioning for perfect alignment */}
        <div className="row-labels">
          <div className="row-label dv">D.V.</div>
          <div className="row-label nv">N.V.</div>
        </div>
      </div>
      
      {/* RPD/LPD Row */}
      <div className="rpd-lpd-row">
        <div className="rpd-lpd-section">
          <span className="label">RPD:</span> {data.rightEye.dv.rpd}
        </div>
        <div className="rpd-lpd-section">
          <span className="label">LPD:</span> {data.leftEye.dv.lpd}
        </div>
      </div>
      
      {/* Retest Date and Signature */}
      <div className="footer">
        <div>
          <span className="label">Retest Date:</span> {retestDate}
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>(Authorised Signatory)</span>
        </div>
      </div>
      
      {/* Footer - Thanks Message */}
      <div className="thanks-message">
        <p>*****Thanks For Your Visit, Have A Nice Day*****</p>
      </div>
    </div>
  );
};

export default PrintablePrescription;
