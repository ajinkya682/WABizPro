import React from 'react';
const Table = ({ columns, data }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border">
          {columns.map((col, i) => (
            <th key={i} className="text-left py-3 px-4 font-semibold text-text-secondary uppercase text-xs tracking-wide">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50/50 transition">
            {columns.map((col, j) => (
              <td key={j} className="py-3 px-4 text-text-primary">
                {col.cell ? col.cell(row) : col.accessor ? row[col.accessor] : null}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
export default Table;
