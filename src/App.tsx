/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, BarChart2, Info, GraduationCap, History, Settings, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CsvUploader from "./components/CsvUploader";
import SampleDataSelector from "./components/SampleDataSelector";
import AnalysisResult from "./components/AnalysisResult";
import AnalysisHistory from "./components/AnalysisHistory";
import { AnalysisRecord } from "./types";

export default function App() {
  const [csvData, setCsvData] = useState<string>("");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [historyRecords, setHistoryRecords] = useState<AnalysisRecord[]>([]);

  // 1. 初始化讀取本地歷史紀錄
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_analysis_history");
      if (saved) {
        setHistoryRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.error("讀取歷史紀錄失敗", e);
    }
  }, []);

  // 2. 當歷史紀錄更新時寫入 localStorage
  const saveHistory = (newRecords: AnalysisRecord[]) => {
    setHistoryRecords(newRecords);
    try {
      localStorage.setItem("ai_analysis_history", JSON.stringify(newRecords));
    } catch (e) {
      console.error("儲存歷史紀錄失敗", e);
    }
  };

  // 3. 處理點擊範例數據
  const handleSelectSample = (content: string, title: string) => {
    setCsvData(content);
    setErrorMsg("");
    setActiveId(null);
    setResult("");

    // 依據範例類型，提供合適的自定義分析焦點，幫助使用者探索
    if (title.includes("業績")) {
      setCustomInstructions("請分析銷售額最高的產品與地區，並針對退貨率最高的品項提供改善思路。");
    } else if (title.includes("轉換")) {
      setCustomInstructions("請計算各管道廣告支出與效益，並特別分析 SEO 自然流量與付費廣告之間的轉換差異與預算優化建議。");
    } else if (title.includes("問卷")) {
      setCustomInstructions("請計算出客戶滿意度的平均值，並歸納出負面評價 (1-3分) 中最核心的產品與服務痛點。");
    } else {
      setCustomInstructions("");
    }
  };

  // 4. 重置新分析
  const handleClearResultAndReset = () => {
    setCsvData("");
    setCustomInstructions("");
    setResult("");
    setActiveId(null);
    setErrorMsg("");
  };

  // 5. 開始呼叫 AI 端點進行分析
  const handleAnalyze = async () => {
    if (!csvData || !csvData.trim()) {
      setErrorMsg("請先輸入、貼上或是拖曳上傳 CSV 格式的數據！");
      return;
    }

    setIsLoading(true);
    setResult("");
    setErrorMsg("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csvData: csvData,
          customInstructions: customInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `伺服器回應錯誤 (狀態碼 ${response.status})`);
      }

      const data = await response.json();
      const analysisResultText = data.analysisResult;

      setResult(analysisResultText);

      // 解析 CSV 首行做為歷史紀錄標題
      const lines = csvData.split(/\r?\n/).filter((line) => line.trim().length > 0);
      let recordTitle = "未命名數據分析";
      if (lines.length > 0) {
        // 取前 3 個欄位名做為標題摘要
        const cols = lines[0].split(",").slice(0, 3).map((c) => c.trim()).join(", ");
        recordTitle = cols ? `資料集: [${cols}...]` : "自訂 CSV 數據分析";
      }

      // 新增歷史紀錄
      const newRecord: AnalysisRecord = {
        id: Date.now().toString(),
        title: recordTitle,
        timestamp: new Date().toLocaleString("zh-TW", { hour12: false }),
        csvData: csvData,
        customInstructions: customInstructions,
        result: analysisResultText,
      };

      const updatedHistory = [newRecord, ...historyRecords];
      saveHistory(updatedHistory);
      setActiveId(newRecord.id);
    } catch (err: any) {
      console.error("Analysis Request Error:", err);
      setErrorMsg(err.message || "連線至後端 API 時發生錯誤，請確認伺服器已正常執行並設定好 API Key。");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. 選擇歷史紀錄
  const handleSelectRecord = (record: AnalysisRecord) => {
    setCsvData(record.csvData);
    setCustomInstructions(record.customInstructions);
    setResult(record.result);
    setActiveId(record.id);
    setErrorMsg("");
  };

  // 7. 刪除單個歷史紀錄
  const handleDeleteRecord = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止觸發點擊載入歷史
    const filtered = historyRecords.filter((r) => r.id !== id);
    saveHistory(filtered);
    if (activeId === id) {
      handleClearResultAndReset();
    }
  };

  // 8. 清空所有歷史紀錄
  const handleClearAllRecords = () => {
    if (window.confirm("確定要刪除本地所有的數據分析紀錄嗎？此操作無法還原。")) {
      saveHistory([]);
      handleClearResultAndReset();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans transition-colors duration-200">
      
      {/* 頂部導覽列 - 呼應 Clean Utility Minimal Layout 設計 */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-3xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              AI 數據分析與洞察工具
              <sub className="text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full border border-indigo-150/80 relative bottom-0.5">
                v1.2.6-PRO
              </sub>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-250">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            系統運作正常
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hidden sm:inline-flex items-center gap-1 font-mono">
            ⚡ Gemini AI Ready
          </span>
        </div>
      </nav>

      {/* 主體區 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col space-y-6">
        
        {/* 錯誤訊息提示區 */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-2xs"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <h5 className="text-sm font-semibold text-amber-800">操作或分析時發生異常</h5>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                {errorMsg}
                <br />
                <span className="text-[10px] text-amber-500 font-normal">
                  提示：請確保您已在 AI Studio 的「Settings &gt; Secrets」面板配置了您的 <strong>GEMINI_API_KEY</strong>。
                </span>
              </p>
            </div>
            <button
              onClick={() => setErrorMsg("")}
              className="text-amber-500 hover:text-amber-700 text-xs shrink-0 cursor-pointer"
            >
              關閉
            </button>
          </motion.div>
        )}

        {/* 範例選擇器：快速測試 */}
        <SampleDataSelector onSelect={handleSelectSample} />

        {/* 主操作網格佈局 (400px Left Stack / rest Right Result Stack) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 左欄控制台 (佔 5/12 寬，完美收納 Input 各式控制) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            
            {/* 核心 Step 1 區塊 */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-50">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  📁 數據控制中心
                </span>
                <span className="text-[10px] uppercase tracking-widest text-indigo-500 font-mono font-bold">
                  Step 01 / 數據
                </span>
              </div>

              {/* CSV 上傳與補充控制 */}
              <CsvUploader
                csvData={csvData}
                onCsvDataChange={(val) => {
                  setCsvData(val);
                  setErrorMsg("");
                }}
                customInstructions={customInstructions}
                onCustomInstructionsChange={(val) => {
                  setCustomInstructions(val);
                  setErrorMsg("");
                }}
              />

              {/* 送出與操作按鈕 */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !csvData.trim()}
                  className={`w-full py-4 px-4 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isLoading
                      ? "bg-indigo-100 text-indigo-400 cursor-not-allowed shadow-none"
                      : !csvData.trim()
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50 shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100/70 hover:shadow-indigo-200 active:scale-98"
                  }`}
                  id="btn-start-analysis"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      正在生成深度數據報告...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      開始 AI 深度分析
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>核心分析: Gemini-3.5-Flash</span>
                  <span>Token 預估: 450 ~ 1200 </span>
                </div>
              </div>
            </div>

            {/* System Instruction Banner - 呼應 Clean Utility Layout */}
            <div className="bg-indigo-950 rounded-2xl p-5 text-white shadow-xl shadow-indigo-950/5 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2 font-mono">
                <Settings className="w-4 h-4 text-indigo-400" />
                系統提示詞 (System Instructions)
              </h3>
              <p className="text-xs text-indigo-100 leading-relaxed opacity-90 font-medium">
                你是一位資深的數據科學與商業決策大師。會依據所提供 CSV 的資料、對指標進行深入統計解讀，剖析關鍵波動趨勢、交叉比對異常點，並以敏銳商業視角產出 3 ~ 5 點具體之營運方案。
              </p>
            </div>

            {/* 本地歷史分析紀錄清單 */}
            <AnalysisHistory
              records={historyRecords}
              activeId={activeId}
              onSelectRecord={handleSelectRecord}
              onDeleteRecord={handleDeleteRecord}
              onClearAllRecords={handleClearAllRecords}
            />
          </div>

          {/* 右欄：AI 分析結果呈現 (佔 7/12 寬) */}
          <div className="lg:col-span-7 h-full flex flex-col">
            <AnalysisResult
              csvData={csvData}
              result={result}
              isLoading={isLoading}
              onClearResult={handleClearResultAndReset}
            />
          </div>

        </div>

        {/* 使用指南說明 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-3xs">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600">
              <span className="w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold">1</span>
              貼上 CSV 數據
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-5.5">
              直接貼上從 Excel、Google 試算表匯出的 CSV 內容，或利用左側拖曳區上傳 CSV，系統會即時識別。
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600">
              <span className="w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold">2</span>
              設定分析方向
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-5.5">
              可加註您想探討的業務細節，系統會將需求無縫融入內建模擬指令中，量身提煉決策分析。
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600">
              <span className="w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center text-[10px] font-bold">3</span>
              一鍵複製報告
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pl-5.5">
              AI 生成報告採用優秀 Markdown 排本。點選右上方複製按钮，即可貼回簡報與報告中發表。
            </p>
          </div>
        </div>

      </main>

      {/* 頁尾 - 呼應 Clean Utility / Minimal 設計 */}
      <footer className="px-8 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] tracking-wider text-slate-400 font-bold uppercase gap-3">
        <span>© 2026 AI DATA INSIGHTS PRO · 繁體中文版本</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-indigo-600 transition-colors">隱私條款</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">API 文檔規格</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">意見與回饋</a>
        </div>
      </footer>
    </div>
  );
}
