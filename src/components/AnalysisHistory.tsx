import React from "react";
import { AnalysisRecord } from "../types";
import { History, Clock, FileSpreadsheet, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AnalysisHistoryProps {
  records: AnalysisRecord[];
  activeId: string | null;
  onSelectRecord: (record: AnalysisRecord) => void;
  onDeleteRecord: (id: string, e: React.MouseEvent) => void;
  onClearAllRecords: () => void;
}

export default function AnalysisHistory({
  records,
  activeId,
  onSelectRecord,
  onDeleteRecord,
  onClearAllRecords,
}: AnalysisHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="bg-slate-55/40 border border-slate-200/80 rounded-xl p-6 text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <History className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-600">無歷史分析紀錄</p>
        <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-normal">
          您在此瀏覽器進行的所有 CSV 報表分析紀錄將會自動安全地保存在本地。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 flex flex-col space-y-3.5 h-full max-h-[500px] overflow-hidden">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
          <History className="w-4 h-4 text-indigo-500" />
          <span>本地歷史分析紀錄</span>
          <span className="text-xs font-medium text-slate-400 font-mono">({records.length})</span>
        </h4>
        <button
          onClick={onClearAllRecords}
          className="text-[10px] text-red-500 hover:text-red-700 font-medium px-2 py-0.5 rounded border border-red-100 hover:bg-red-50 transition-colors cursor-pointer"
          id="btn-clear-all-history"
        >
          全部清除
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
        <AnimatePresence initial={false}>
          {records.map((record) => {
            const isActive = record.id === activeId;
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`group relative p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer flex flex-col space-y-1.5 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-50/20 shadow-xs"
                    : "border-slate-150 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
                onClick={() => onSelectRecord(record)}
                id={`history-${record.id}`}
              >
                {/* 刪除按鈕 */}
                <button
                  onClick={(e) => onDeleteRecord(record.id, e)}
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all cursor-pointer z-10"
                  id={`btn-delete-${record.id}`}
                  title="刪除此紀錄"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5 pr-6">
                  <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-500" : "text-slate-400"}`} />
                  <span className="font-semibold text-slate-700 text-xs truncate leading-normal">
                    {record.title}
                  </span>
                </div>

                {record.customInstructions && (
                  <p className="text-[10px] text-slate-405 italic truncate px-5">
                    「{record.customInstructions}」
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-5">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-300" />
                    {record.timestamp}
                  </span>
                  {isActive && (
                    <span className="text-indigo-600 font-semibold flex items-center gap-0.5 animate-pulse">
                      檢視中 <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
