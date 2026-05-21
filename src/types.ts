export interface AnalysisRecord {
  id: string;
  title: string;
  timestamp: string;
  csvData: string;
  customInstructions: string;
  result: string;
}

export interface SampleData {
  id: string;
  title: string;
  description: string;
  content: string;
  icon: string; // lucide icon name
}
