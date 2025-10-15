
import React from 'react';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface DataTableProps {
  data: any[];
  columns: {
    field: string;
    header: string;
    body?: (rowData: any) => React.ReactNode;
  }[];
}

export function DataTable({ data, columns }: DataTableProps) {
  return (
    <PrimeDataTable value={data} className="p-datatable-sm">
      {columns.map((col) => (
        <Column 
          key={col.field} 
          field={col.field} 
          header={col.header}
          body={col.body}
        />
      ))}
    </PrimeDataTable>
  );
}
