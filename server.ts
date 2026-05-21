import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" })); // 提供足夠大小貼 csv

// 緩慢初始化，安全檢查 API 金鑰
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required. Please check your secrets configurations.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API 路由
app.post("/api/analyze", async (req, res) => {
  try {
    const { csvData, customInstructions } = req.body;
    if (!csvData || typeof csvData !== "string") {
      return res.status(400).json({ error: "無效的 CSV 數據內容" });
    }

    const ai = getGeminiClient();

    const systemInstruction = `你是一位專業的高級數據分析師與商業洞察專家。
使用者會為你提供 CSV 格式的報表數據。
請採取繁體中文（台灣習慣用語，如「數據」、「資訊」等，禁止簡體字與大陸用語）對數據進行深度分析：
1. 數據總覽：簡述數據集的主體、資料筆數、結構與關鍵欄位（包含維度與指標說明）。
2. 數據清洗與觀測（選填）：若有異常值、缺失值，請簡述。
3. 關鍵洞察：找出數據中的潛在趨勢、規律、高峰期、低谷期，或值得關注的變化指標。
4. 商業改進建議：基於發現的趨勢，提供 3 到 5 點具體的、可操作且具備決策價值的商業建議。
5. 數據綜合摘要（Markdown 表格）：如果適合，使用 Markdown 表格摘要出前幾個重要指標、加總、平均或比率，讓結構一目了然。

請確保輸出格式層次分明，富有美感與商業高度，具備優秀的 Markdown 排版，讓報告易於閱讀。`;

    let userPrompt = `以下為我要分析的 CSV 數據內容：\n\n\`\`\`csv\n${csvData}\n\`\`\``;
    if (customInstructions) {
      userPrompt += `\n\n特殊的分析要求與分析著重點：\n${customInstructions}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // 稍低點以保持分析準確與嚴謹
      },
    });

    if (!response || !response.text) {
      return res.status(500).json({ error: "AI 分析未返回任何結果，請稍後重試。" });
    }

    res.json({ analysisResult: response.text });
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: error.message || "伺服器內部錯誤，請檢查 API Key 設定" });
  }
});

// 靜態檔案或 Vite 中間件
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
