import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface TransactionResult {
  isFraud: boolean;
  confidence: number;
  riskFactors?: string[];
  amount?: string;
  merchant?: string;
}

const FraudDetector = () => {
  const [results, setResults] = useState<TransactionResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const analyzeTransaction = async (data: any): Promise<TransactionResult> => {
    try {
        const response = await fetch("https://trans-shield-app-1.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(data.amount || "0"), time: parseInt(data.time || "0") }),
      });

      if (!response.ok) {
        throw new Error("Backend error");
      }

      const result = await response.json();
      const isFraud = result.prediction === 1;
      const confidence = Math.floor(result.probability * 100);

      const riskFactors = [];
      if (parseFloat(data.amount || "0") > 5000) riskFactors.push("High transaction amount");

      return {
        isFraud,
        confidence,
        riskFactors: isFraud ? riskFactors : [],
        amount: data.amount,
        merchant: data.merchant,
      };
    } catch (error) {
      console.error("Error analyzing transaction:", error);
      return {
        isFraud: false,
        confidence: 0,
        riskFactors: ["Error connecting to backend"],
        amount: data.amount,
        merchant: data.merchant,
      };
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch("https://trans-shield-app-1.onrender.com/predict-file", {

        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Backend error');
      }

      const data = await response.json();
      const analyzedResults: TransactionResult[] = data.predictions.map((pred: any) => ({
        isFraud: pred.Fraud_Prediction === 1,
        confidence: Math.floor(pred.Fraud_Probability * 100),
        riskFactors: pred.Fraud_Prediction === 1 ? ["High fraud probability"] : [],
        amount: pred.Amount?.toString(),
        merchant: "",
      }));

      setResults(analyzedResults);
      toast.success(`Analyzed ${analyzedResults.length} transactions`);
    } catch (error) {
      console.error("Error processing CSV file:", error);
      toast.error("Error processing CSV file");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    try {
      const result = await analyzeTransaction({ amount: manualInput, merchant: "", location: "", time: "" });
      setResults([result]);
      toast.success("Transaction analyzed");
    } catch (error) {
      console.error("Error analyzing transaction:", error);
      toast.error("Error analyzing transaction");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-hero)] py-12 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-primary/20 shadow-[var(--shadow-glow)] animate-glow-pulse">
              <TrendingUp className="w-14 h-14 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
            Fraud Detection System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Advanced AI-powered credit card fraud detection. Upload CSV files or analyze individual transactions instantly.
          </p>
        </header>

        <Card className="max-w-4xl mx-auto p-8 shadow-[var(--shadow-elevated)] border border-primary/20 bg-[var(--gradient-card)] backdrop-blur-xl animate-scale-in">
          <Tabs defaultValue="csv" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="csv" className="text-base">
                <Upload className="w-4 h-4 mr-2" />
                CSV Upload
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-base">
                <FileText className="w-4 h-4 mr-2" />
                Manual Input
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-6 animate-fade-in">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 group">
                <Upload className="w-16 h-16 mx-auto mb-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="text-lg font-semibold mb-2 text-foreground">Upload CSV File</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to browse or drag and drop your transaction data
                  </p>
                  <div className="mt-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg text-white px-4 py-2 rounded cursor-pointer inline-block font-semibold">
                    Choose File
                  </div>
                </Label>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Expected format: amount, merchant, location, time
              </p>
            </TabsContent>

            <TabsContent value="manual">
              <form onSubmit={handleManualSubmit} className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                  <Label htmlFor="transaction-text" className="text-base font-medium">Transaction Details</Label>
                  <Textarea
                    id="transaction-text"
                    placeholder="Enter transaction details here..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="min-h-[200px] bg-muted/50 border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-primary via-primary-glow to-accent hover:shadow-[var(--shadow-glow)] hover:scale-[1.02] text-lg py-7 font-semibold transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-pulse">Analyzing</span>
                      <span className="animate-bounce">...</span>
                    </span>
                  ) : (
                    "Analyze Transaction"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {results.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8 space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Analysis Results</h2>
            {results.map((result, index) => (
              <Card 
                key={index} 
                className={`p-6 shadow-[var(--shadow-elevated)] border-2 transition-all duration-300 hover:scale-[1.01] animate-scale-in ${
                  result.isFraud 
                    ? "border-destructive/40 bg-gradient-to-br from-destructive/10 to-destructive/5 hover:border-destructive/60" 
                    : "border-success/40 bg-gradient-to-br from-success/10 to-success/5 hover:border-success/60"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {result.isFraud ? (
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                      ) : (
                        <CheckCircle className="w-6 h-6 text-success" />
                      )}
                      <h3 className={`text-xl font-bold ${
                        result.isFraud ? "text-destructive" : "text-success"
                      }`}>
                        {result.isFraud ? "Fraudulent Transaction Detected" : "Legitimate Transaction"}
                      </h3>
                    </div>
                    
                    {result.amount && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Amount:</span> ${result.amount}
                        </p>
                        {result.merchant && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Merchant:</span> {result.merchant}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold">Confidence:</span>
                      <div className="flex-1 max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${result.isFraud ? "bg-destructive" : "bg-success"}`}
                          style={{ width: `${result.confidence}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{result.confidence}%</span>
                    </div>

                    {result.riskFactors && result.riskFactors.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-2">Risk Factors:</p>
                        <ul className="space-y-1">
                          {result.riskFactors.map((factor, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudDetector;
