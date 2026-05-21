import React from "react";
import { SAMPLE_DATASETS } from "../data/samples";
import { SampleData } from "../types";
import { ShoppingBag, TrendingUp, Users, Cpu } from "lucide-react";
import { motion } from "motion/react";

interface SampleDataSelectorProps {
  onSelect: (content: string, title: string) => void;
}

export default function SampleDataSelector({ onSelect }: SampleDataSelectorProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "ShoppingBag":
        return <ShoppingBag className="w-5 h-5 text-indigo-500" />;
      case "TrendingUp":
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case "Users":
        return <Users className="w-5 h-5 text-amber-500" />;
      default:
        return <Cpu className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
          💡 快速測試：選擇經典範例數據
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">點選快速套用 CSV 格式</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SAMPLE_DATASETS.map((sample: SampleData) => (
          <motion.button
            key={sample.id}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(sample.content, sample.title)}
            className="flex flex-col text-left p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-xs transition-all focus:outline-none cursor-pointer"
            id={`sample-${sample.id}`}
          >
            <div className="flex items-center gap-2 mb-2 justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50/50 rounded-lg">
                  {getIcon(sample.icon)}
                </div>
                <span className="font-bold text-slate-800 text-sm">{sample.title}</span>
              </div>
              <span className="text-[9px] font-mono font-extrabold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/40">
                {sample.id === "1" ? "E-COMMERCE" : sample.id === "2" ? "MARKETING" : "FEEDBACK"}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {sample.description}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
