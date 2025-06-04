import React from 'react';
import { PrescriptionData } from '../../types';
import { format } from 'date-fns';

// Add card-specific print styles
const cardPrintStyles = `
  @media print {
    @page {
      size: 3.5in 2in;
      margin: 0.05in;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      font-size: 6pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card-print-container {
      padding: 0.05in;
      width: 3.4in;
      height: 1.9in;
      box-sizing: border-box;
      overflow: hidden;
      page-break-after: avoid;
    }
    html, body {
      height: 100%;
      page-break-after: avoid;
      page-break-before: avoid;
    }
    .no-print {
      display: none !important;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 5.5pt;
      table-layout: fixed;
    }
    table td, table th {
      border: 1px solid black;
      padding: 0.02in;
      text-align: center;
      overflow: hidden;
      white-space: nowrap;
    }
    .header {
      text-align: center;
      margin-bottom: 0.05in;
      line-height: 1;
    }
    .header h2 {
      font-size: 7pt;
      margin: 0 0 0.02in 0;
      font-weight: bold;
    }
    .header div {
      font-size: 5.5pt;
      margin: 0;
      line-height: 1.1;
    }
    .info-table {
      margin-bottom: 0.03in;
      border: none;
    }
    .info-table td {
      border: none;
      padding: 0 0.02in;
      text-align: left;
      font-size: 5.5pt;
      line-height: 1.1;
      white-space: normal;
    }
    .info-label {
      font-weight: bold;
      margin-right: 0.02in;
    }
    .footer {
      margin-top: 0.05in;
      text-align: center;
      font-size: 5pt;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 0.04in;
      font-size: 5.5pt;
    }
    .thanks-message {
      text-align: center;
      font-weight: bold;
      margin-top: 0.02in;
      font-size: 5.5pt;
    }
    .prescription-table {
      position: relative;
      margin-bottom: 0.03in;
    }
    .row-label {
      font-weight: bold;
      text-align: right;
      padding-right: 0.03in;
      width: 0.2in;
    }
    .rpd-lpd-row {
      display: flex;
      justify-content: space-between;
      font-size: 5.5pt;
      margin-top: 0.02in;
    }
  }
`;

interface PrintableCardPrescriptionProps {
  data: PrescriptionData;
}

const PrintableCardPrescription: React.FC<PrintableCardPrescriptionProps> = ({ data }) => {
  // Format date as dd-MMM-yyyy
  const shortFormattedDate = data.date ? format(new Date(data.date), 'dd-MMM-yyyy') : format(new Date(), 'dd-MMM-yyyy');
  const retestDate = data.retestAfter ? format(new Date(data.retestAfter), 'dd/MM/yyyy') : '';

  return (
    <div className="card-print-container">
      <style>{cardPrintStyles}</style>
      
      {/* Clinic Header */}
      <div className="header">
        <h2>Lucky Opticians</h2>
        <div>A.V. Building, In front of Biroba Temple, Near S.T. Stand, Karad.</div>
        <div>Mob No.: 9922637944</div>
      </div>
      
      {/* Patient Info - Two column layout */}
      <table className="info-table">
        <tbody>
          <tr>
            <td style={{ width: '50%' }}>
              <span className="info-label">Name:</span> {data.name}
            </td>
            <td style={{ width: '50%' }}>
              <span className="info-label">Prescription No:</span> {data.prescriptionNo}
            </td>
          </tr>
          <tr>
            <td>
              <span className="info-label">Date:</span> {shortFormattedDate}
            </td>
            <td>
              <span className="info-label">Prescribed By:</span> {data.prescribedBy}
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <span className="info-label">IPD:</span> {data.ipd}
            </td>
          </tr>
        </tbody>
      </table>
      
      {/* Prescription Table */}
      <div className="prescription-table">
        <table>
          <thead>
            <tr>
              <th colSpan={5} style={{ borderBottom: '2px solid black' }}>RIGHT</th>
              <th colSpan={5} style={{ borderBottom: '2px solid black' }}>LEFT</th>
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
        
        {/* D.V./N.V. Labels on left side */}
        <div style={{ position: 'absolute', left: '-0.22in', top: '0.2in' }}>
          <div style={{ height: '0.15in' }} className="row-label">D.V.</div>
          <div style={{ height: '0.15in' }} className="row-label">N.V.</div>
        </div>
      </div>
      
      {/* RPD/LPD Row */}
      <div className="rpd-lpd-row">
        <div style={{ textAlign: 'left', width: '50%' }}>
          <span className="info-label">RPD:</span> {data.rightEye.dv.rpd}
        </div>
        <div style={{ textAlign: 'left', width: '50%' }}>
          <span className="info-label">LPD:</span> {data.leftEye.dv.lpd}
        </div>
      </div>
      
      {/* Retest Date and Signature Row */}
      <div className="signature-row">
        <div>
          <span className="info-label">Retest Date:</span> {retestDate}
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>(Authorised Signatory)</span>
        </div>
      </div>
      
      {/* Thanks Message */}
      <div className="thanks-message">
        <p style={{ margin: '0' }}>*****Thanks For Your Visit, Have A Nice Day*****</p>
      </div>
    </div>
  );
};

export default PrintableCardPrescription;
