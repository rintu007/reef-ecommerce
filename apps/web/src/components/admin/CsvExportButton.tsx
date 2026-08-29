"use client";

/** No way to pull the on-screen numbers into a spreadsheet before this — csv is pre-built server-side from the same data already rendered on the page. */
export function CsvExportButton({ filename, csv }: { filename: string; csv: string }) {
  function handleClick() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleClick}
      className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
    >
      Export CSV
    </button>
  );
}
