import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Trash2, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface CsvUploaderProps {
  csvData: string;
  onCsvDataChange: (data: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (val: string) => void;
}

export default function CsvUploader({
  csvData,
  onCsvDataChange,
  customInstructions,
  onCustomInstructionsChange,
}: CsvUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 簡單的 CSV 解析，供即時預覽
  const getCsvPreview = () => {
    if (!csvData || !csvData.trim()) return null;
    const lines = csvData.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) return null;

    const headers = lines[0].split(",").map((h) => h.trim());
    const previewRows = lines.slice(1, 4).map((line) => {
      return line.split(",").map((cell) => cell.trim());
    });

    const totalRowsCount = lines.length - 1;
    return { headers, rows: previewRows, totalRowsCount };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // 檢查檔案類型或副檔名
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "csv" && fileExtension !== "txt" && file.type !== "text/csv") {
      alert("請上報標準的 .csv 或 .txt 純文字數據檔案！");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        onCsvDataChange(text);
      }
    };
    reader.onerror = () => {
      alert("讀取檔案時發生錯誤！");
    };
    reader.readAsText(file, "UTF-8");
  };

  const clearData = () => {
    onCsvDataChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const preview = getCsvPreview();

  return (
    <div className="space-y-5">
      {/* 拖曳與貼上區 */}
      <div className="flex flex-col">
        <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            📊 貼上或上傳您的 CSV 資料
            <span className="text-red-500 font-bold">*</span>
          </span>
          {csvData && (
            <button
              onClick={clearData}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
              id="btn-clear-csv"
            >
              <Trash2 className="w-3.5 h-3.5" /> 清除數據
            </button>
          )}
        </label>

        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl transition-all duration-200 ${
            isDragActive
              ? "border-indigo-500 bg-indigo-50/50"
              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          {/* 隱藏的 Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />

          <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 items-stretch">
            {/* 左側：Textarea 輸入 */}
            <div className="flex-1 flex flex-col">
              <textarea
                value={csvData}
                onChange={(e) => onCsvDataChange(e.target.value)}
                placeholder="在此貼上您的 CSV 內容，範例：&#10;月份,產品,銷售額&#10;1月,A商品,100000&#10;2月,B商品,150000..."
                className="w-full h-44 p-3 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 resize-y"
                id="csv-textarea"
              />
            </div>

            {/* 右側：拖曳或點選上傳 */}
            <div
              className="md:w-56 flex flex-col items-center justify-content justify-center border border-slate-200/85 bg-white rounded-lg p-5 text-center cursor-pointer hover:border-slate-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              id="drop-zone-click"
            >
              <UploadCloud className="w-8 h-8 text-indigo-500 mb-2.5 animate-pulse" />
              <p className="text-xs font-semibold text-slate-700">拖曳 CSV 檔案至此</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">或點擊此處瀏覽電腦檔案</p>
              <p className="text-[9px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 mt-3 border border-slate-200">
                支援 .csv / .txt 格式
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSV 即時結構預覽 */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5" /> 系統已識別：共 {preview.totalRowsCount} 筆數據 (僅預覽前 3 筆)
            </span>
          </div>
          <div className="overflow-x-auto border border-slate-150 rounded-lg max-h-56">
            <table className="min-w-full divide-y divide-slate-150 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                <tr>
                  {preview.headers.map((header, idx) => (
                    <th key={idx} className="px-4 py-2 text-left border-r border-slate-150 last:border-0 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 bg-white">
                {preview.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                    {preview.headers.map((_, colIdx) => (
                      <td key={colIdx} className="px-4 py-2 border-r border-slate-100 last:border-0 font-mono">
                        {row[colIdx] !== undefined ? row[colIdx] : <span className="text-slate-300">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 分析需求著重點 */}
      <div className="flex flex-col">
        <label className="block text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1">
          🎯 補充分析指示 / 特殊要求 (選填)
        </label>
        <input
          type="text"
          value={customInstructions}
          onChange={(e) => onCustomInstructionsChange(e.target.value)}
          placeholder="例如：「請特別幫我分析第三季度的異常高點成因，並提出如何降低退貨率」、「著重在行銷渠道的 ROI 最佳化」"
          className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
          id="custom-instructions-input"
        />
        <p className="text-[11px] text-slate-400 mt-1.5 flex items-start gap-1">
          <HelpCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>您可以在此處指定特定的分析變量、期望的圖表維度，或是希望 AI 提供解答的具體業務方向。</span>
        </p>
      </div>
    </div>
  );
}
