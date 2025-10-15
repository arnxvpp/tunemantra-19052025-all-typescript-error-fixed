import { format } from 'date-fns';

export type ExportFormat = 'csv' | 'json';

export interface ExportOptions {
  format?: ExportFormat;
  filename?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

const defaultOptions: ExportOptions = {
  format: 'csv',
  filename: `export-${format(new Date(), 'yyyy-MM-dd')}` // Use date-fns format here
};

export function downloadData(data: any[], options: ExportOptions = {}) {
  // Rename format variable to avoid collision with date-fns format function
  const { format: exportFormat, filename, dateRange } = { ...defaultOptions, ...options }; 
  let content: string;
  let mimeType: string;

  if (exportFormat === 'csv') { // Use renamed variable
    content = convertToCSV(data);
    mimeType = 'text/csv';
  } else {
    content = JSON.stringify(data, null, 2);
    mimeType = 'application/json';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  // Use the renamed variable exportFormat for the file extension
  // Use date-fns format for the date part
  link.setAttribute('download', `${filename}-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`); 
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header];
      // Handle special cases like nested objects, arrays, dates
      if (value instanceof Date) {
        return format(value, 'yyyy-MM-dd'); // Use date-fns format here
      }
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      // Handle numbers with proper formatting
      if (typeof value === 'number') {
        return value.toString();
      }
      // Escape quotes and handle commas for strings
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}