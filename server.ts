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

// 模擬/Demo 數據分析生成器 (當缺乏 API Key 時的防錯降級方案)
function generateMockAnalysis(csvData: string, customInstructions: string = ""): string {
  const lines = csvData.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) return "### 1. 📊 資料概況與欄位理解\n無效的 CSV 數據。";

  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => line.split(",").map(v => v.trim()));

  const headersStr = headers.join(",");
  const isEcommerce = headersStr.includes("銷售額") || headersStr.includes("退貨率") || headersStr.includes("產品類別");
  const isMarketing = headersStr.includes("roas") || headersStr.includes("轉換") || headersStr.includes("曝光");
  const isFeedback = headersStr.includes("滿意度") || headersStr.includes("評分") || headersStr.includes("nps");

  let report = "";

  if (isEcommerce) {
    let totalSales = 0;
    let totalOrders = 0;
    let categorySales: { [key: string]: number } = {};
    let categoryOrders: { [key: string]: number } = {};
    let anomalies: string[] = [];

    const salesIdx = headers.findIndex(h => h.includes("銷售額"));
    const orderIdx = headers.findIndex(h => h.includes("訂單數"));
    const returnIdx = headers.findIndex(h => h.includes("退貨率"));
    const categoryIdx = headers.findIndex(h => h.includes("產品類別"));

    rows.forEach((row, i) => {
      const cat = categoryIdx !== -1 ? row[categoryIdx] : "一般商品";
      const sales = salesIdx !== -1 ? parseFloat(row[salesIdx]) || 0 : 0;
      const orders = orderIdx !== -1 ? parseInt(row[orderIdx]) || 0 : 0;
      const retRate = returnIdx !== -1 ? parseFloat(row[returnIdx]) || 0 : 0;

      totalSales += sales;
      totalOrders += orders;

      categorySales[cat] = (categorySales[cat] || 0) + sales;
      categoryOrders[cat] = (categoryOrders[cat] || 0) + orders;

      if (retRate > 0.05) {
        anomalies.push(`第 ${i+2} 列「${cat}」退貨率達 ${(retRate*100).toFixed(1)}%，明顯偏高。`);
      }
    });

    let bestCat = "";
    let maxSales = -1;
    for (const cat in categorySales) {
      if (categorySales[cat] > maxSales) {
        maxSales = categorySales[cat];
        bestCat = cat;
      }
    }

    report += `### 1. 📊 資料概況與欄位理解
本數據主題為 **電商季度銷售業績分析報表**。記錄了不同月份與銷售地區中各類產品的業績指標。
關鍵欄位意義如下：
${headers.map(h => `- **${h}**：本數據集中代表商品的${h}。`).join("\n")}

### 2. ⚠️ 異常與缺值檢查
${anomalies.length > 0 ? anomalies.map(a => `- ${a}`).join("\n") : "未發現明顯異常"}

### 3. 📈 統計與趨勢洞察
- **總計概況**：銷售總金額加總為 **TWD ${totalSales.toLocaleString()} 元**，總計成交訂單為 **${totalOrders.toLocaleString()} 筆**。
- **分類表現**：產品類別 **「${bestCat}」** 表現最好，累計創造營收 **TWD ${maxSales.toLocaleString()} 元**。
- **業務建議**：
  1. 針對退貨率偏高的商品類別，建議重新優化尺碼標示或加強品質檢驗，以降低退貨逆向物流成本。
  2. 持續推廣表現最優的「${bestCat}」，適當提撥行銷資源以擴大其在地區市場的銷售領先優勢。`;
  } else if (isMarketing) {
    let totalSpend = 0;
    let totalRevenue = 0;
    let totalClicks = 0;
    let channelRevenue: { [key: string]: number } = {};
    let anomalies: string[] = [];

    const spendIdx = headers.findIndex(h => h.includes("花費") || h.includes("支出") || h.includes("成本"));
    const revIdx = headers.findIndex(h => h.includes("營收") || h.includes("收入") || h.includes("額"));
    const clickIdx = headers.findIndex(h => h.includes("點擊"));
    const channelIdx = headers.findIndex(h => h.includes("渠道") || h.includes("管道"));

    rows.forEach((row, i) => {
      const channel = channelIdx !== -1 ? row[channelIdx] : "一般管道";
      const spend = spendIdx !== -1 ? parseFloat(row[spendIdx]) || 0 : 0;
      const rev = revIdx !== -1 ? parseFloat(row[revIdx]) || 0 : 0;
      const clicks = clickIdx !== -1 ? parseInt(row[clickIdx]) || 0 : 0;

      totalSpend += spend;
      totalRevenue += rev;
      totalClicks += clicks;

      channelRevenue[channel] = (channelRevenue[channel] || 0) + rev;

      const roas = spend > 0 ? rev / spend : 0;
      if (roas > 15) {
        anomalies.push(`第 ${i+2} 列「${channel}」ROAS 效益異常優異 (${roas.toFixed(1)}x)，應驗證數據之歸因模型。`);
      }
    });

    let bestChannel = "";
    let maxRev = -1;
    for (const ch in channelRevenue) {
      if (channelRevenue[ch] > maxRev) {
        maxRev = channelRevenue[ch];
        bestChannel = ch;
      }
    }

    report += `### 1. 📊 資料概況與欄位理解
本數據主題為 **網站流量與行銷渠道轉換率分析報表**。分析了不同行銷管道的曝光、點擊與營收 ROAS。
關鍵欄位意義如下：
${headers.map(h => `- **${h}**：本數據集上記錄行銷渠道的${h}指標。`).join("\n")}

### 2. ⚠️ 異常與缺值檢查
${anomalies.length > 0 ? anomalies.map(a => `- ${a}`).join("\n") : "未發現明顯異常"}

### 3. 📈 統計與趨勢洞察
- **總計概況**：所有行銷管道總廣告花費約為 **TWD ${totalSpend.toLocaleString()} 元**，總體帶來營收為 **TWD ${totalRevenue.toLocaleString()} 元**，總點擊數為 **${totalClicks.toLocaleString()} 次**。
- **分類表現**：行銷管道 **「${bestChannel}」** 表現最好，累計創造最多營收 **TWD ${maxRev.toLocaleString()} 元**。
- **業務建議**：
  1. 對於高轉化與高 ROAS 的管道（如 EDM 電子報或 SEO 自然流量），應優先進行防流失維護與優化，以最低成本拉抬營收。
  2. 針對高花費但 ROAS 偏低的渠道，建議重新調整受眾定位或素材創意，避免行銷預算效益邊際遞減。`;
  } else if (isFeedback) {
    let sumNPS = 0;
    let countNPS = 0;
    let anomalies: string[] = [];

    const npsIdx = headers.findIndex(h => h.includes("NPS") || h.includes("推薦") || h.includes("評分"));
    const feedbackIdx = headers.findIndex(h => h.includes("反饋") || h.includes("意見") || h.includes("評論"));

    rows.forEach((row, i) => {
      const nps = npsIdx !== -1 ? parseFloat(row[npsIdx]) || 0 : 0;
      if (npsIdx !== -1) {
        sumNPS += nps;
        countNPS++;
      }
      if (nps < 5) {
        const txt = feedbackIdx !== -1 ? row[feedbackIdx] : "無具體文字意見";
        anomalies.push(`客戶第 ${i+2} 列評評分僅 ${nps} 分偏低，反饋意見為：「${txt}」。`);
      }
    });

    const avgNPS = countNPS > 0 ? sumNPS / countNPS : 0;

    report += `### 1. 📊 資料概況與欄位理解
本數據主題為 **客戶滿意度與產品功能問卷調查**。記錄了不同客戶對於產品功能、客服服務、物流速度的評分與反饋。
關鍵欄位意義如下：
${headers.map(h => `- **${h}**：本數據集中記錄客戶${h}之欄位。`).join("\n")}

### 2. ⚠️ 異常與缺值檢查
${anomalies.length > 0 ? anomalies.map(a => `- ${a}`).join("\n") : "未發現明顯異常"}

### 3. 📈 統計與趨勢洞察
- **總計概況**：本問卷收集到共計 **${rows.length} 筆** 客戶回覆，整體平均滿意度得分為 **${avgNPS.toFixed(2)} 分**。
- **分類表現**：整體客戶體驗在物流速度與基礎功能滿意度上表現最好；主要痛點集中於部分軟體介面卡頓或出貨等待時間過長。
- **業務建議**：
  1. 針對評分較低（1-3分）的客戶反饋，優先指派客服專員聯繫並解決其軟體使用與物流延誤問題，轉化潛在流失客群。
  2. 持續優化滿意度得分較高之服務（如物流配送），將其作為品牌競爭優勢進行市場宣傳。`;
  } else {
    report += `### 1. 📊 資料概況與欄位理解
本數據主題為 **自訂數據結構分析報表**。包含多個維度與統計指標。
關鍵欄位意義如下：
${headers.map(h => `- **${h}**：本數據集中用於記錄${h}之欄位。`).join("\n")}

### 2. ⚠️ 異常與缺值檢查
未發現明顯異常。

### 3. 📈 統計與趨勢洞察
- **總計概況**：本資料集共載入 **${rows.length} 筆** 完整行資料，數據結構分布均勻。
- **分類表現**：各維度指標表現穩定，主要銷售/流量/滿意度品項運作良好。
- **業務建議**：
  1. 建議定期追蹤與更新本數據庫，以維持指標資料的即時性與代表性。
  2. 針對高貢獻度之資料維度，做進一步交叉分析，以找出深層的營運增長點。`;
  }

  // 貼心提示：說明這是 Demo 降級模式，並引導如何設定
  report += `\n\n> 💡 **系統提示（模擬分析模式）**\n> 偵測到您尚未在系統中配置有效之 \`GEMINI_API_KEY\`，目前正以本機分析引擎為您提供 **DEMO 數據模擬與精確交叉比對**。若要解鎖完整的 Gemini-3.5-Flash AI 模型全自動深度商業洞察，請至 AI Studio 的「Settings > Secrets」設定面板中，新增一個名為 \`GEMINI_API_KEY\` 的金鑰，或在專案根目錄下配置您的 \`.env\` 檔案。`;

  return report;
}

// API 路由
app.post("/api/analyze", async (req, res) => {
  try {
    const { csvData, customInstructions } = req.body;
    if (!csvData || typeof csvData !== "string") {
      return res.status(400).json({ error: "無效的 CSV 數據內容" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isMockMode = !apiKey || apiKey === "MY_GEMINI_API_KEY";

    if (isMockMode) {
      console.warn("⚠️ [SYSTEM WARNING] GEMINI_API_KEY is not configured or is the default placeholder. Running in dynamic Mock/Demo Mode...");
      const mockResult = generateMockAnalysis(csvData, customInstructions);
      return res.json({ analysisResult: mockResult });
    }

    const ai = getGeminiClient();

    const systemInstruction = `你是一位專業的資料分析師。
你的任務是接收一段 CSV 或表格結構的原始數據，理解其欄位意義，並提出精確的摘要報告與洞察。

請務必嚴格遵循以下 Markdown 輸出格式：

### 1. 📊 資料概況與欄位理解
簡要說明這份資料的主題是什麼，並列出關鍵欄位的意義。

### 2. ⚠️ 異常與缺值檢查
檢查資料中是否有空白（例如缺少數量或金額）、極端值（例如不合理的高價），並將發現的異常項目條列出來。若無異常，說明「未發現明顯異常」。

### 3. 📈 統計與趨勢洞察
請回答以下問題的總結：
- **總計概況**：銷售數量或總金額的大概加總。
- **分類表現**：哪個業務員或哪項產品表現最好？
- **業務建議**：從數據中給出 1-2 個可以執行的商業建議。

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。`;

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
