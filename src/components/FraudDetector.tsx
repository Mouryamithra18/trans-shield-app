import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [manualInput, setManualInput] = useState({
    amount: "",
    merchant: "",
    location: "",
    time: "",
  });

  const analyzeTransaction = (data: any): TransactionResult => {
    // Mock fraud detection logic
    const amount = parseFloat(data.amount || "0");
    const randomScore = Math.random();
    const isFraud = amount > 5000 || randomScore > 0.7;
    const confidence = Math.floor((isFraud ? 75 + Math.random() * 20 : 80 + Math.random() * 15));
    
    const riskFactors = [];
    if (amount > 5000) riskFactors.push("High transaction amount");
    if (randomScore > 0.8) riskFactors.push("Unusual merchant pattern");
    if (data.location && data.location.toLowerCase().includes("unknown")) {
      riskFactors.push("Suspicious location");
    }

    return {
      isFraud,
      confidence,
      riskFactors: isFraud ? riskFactors : [],
      amount: data.amount,
      merchant: data.merchant,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsAnalyzing(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        
        const analyzedResults: TransactionResult[] = [];
        
        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          const values = lines[i].split(",");
          const transaction: any = {};
          headers.forEach((header, index) => {
            transaction[header] = values[index]?.trim() || "";
          });
          analyzedResults.push(analyzeTransaction(transaction));
        }
        
        setResults(analyzedResults);
        toast.success(`Analyzed ${analyzedResults.length} transactions`);
      } catch (error) {
        toast.error("Error processing CSV file");
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    reader.readAsText(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const result = analyzeTransaction(manualInput);
      setResults([result]);
      setIsAnalyzing(false);
      toast.success("Transaction analyzed");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-hero)] py-12 px-4">
      <div className="max-width-6xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-2xl bg-primary/10 backdrop-blur">
              <TrendingUp className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Fraud Detection System
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI-powered credit card fraud detection. Upload CSV files or analyze individual transactions instantly.
          </p>
        </header>

        <Card className="max-w-4xl mx-auto p-8 shadow-[var(--shadow-elevated)] border-border/50">
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

            <TabsContent value="csv" className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="text-lg font-semibold mb-2">Upload CSV File</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click to browse or drag and drop your transaction data
                  </p>
                  <Button type="button" variant="outline" className="mt-2">
                    Choose File
                  </Button>
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
              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Transaction Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="1250.00"
                      value={manualInput.amount}
                      onChange={(e) => setManualInput({ ...manualInput, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="merchant">Merchant Name</Label>
                    <Input
                      id="merchant"
                      placeholder="Online Store XYZ"
                      value={manualInput.merchant}
                      onChange={(e) => setManualInput({ ...manualInput, merchant: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="New York, USA"
                      value={manualInput.location}
                      onChange={(e) => setManualInput({ ...manualInput, location: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Transaction Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={manualInput.time}
                      onChange={(e) => setManualInput({ ...manualInput, time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[var(--gradient-primary)] hover:opacity-90 text-lg py-6"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Transaction"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {results.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8 space-y-4">
            <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
            {results.map((result, index) => (
              <Card 
                key={index} 
                className={`p-6 shadow-[var(--shadow-card)] border-2 ${
                  result.isFraud 
                    ? "border-destructive/30 bg-destructive/5" 
                    : "border-success/30 bg-success/5"
                }`}
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
