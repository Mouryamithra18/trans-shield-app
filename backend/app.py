from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import joblib
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

# Initialize FastAPI app
app = FastAPI(title="Credit Card Fraud Detection API")

# Allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
model = joblib.load("models/fraud_model.joblib")

# ✅ Expected columns (30 input features)
EXPECTED_COLUMNS = [
    'Time','V1','V2','V3','V4','V5','V6','V7','V8','V9',
    'V10','V11','V12','V13','V14','V15','V16','V17','V18','V19',
    'V20','V21','V22','V23','V24','V25','V26','V27','V28','Amount'
]

@app.get("/")
def home():
    return {"message": "✅ Fraud Detection API is running successfully!"}

@app.post("/predict-file")
async def predict_file(file: UploadFile = File(...)):
    try:
        # Read uploaded CSV
        df = pd.read_csv(file.file)
        
        # ✅ Step 1: Validate columns
        missing = [col for col in EXPECTED_COLUMNS if col not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")
        
        # ✅ Step 2: Keep only relevant columns (ignore extras)
        df = df[EXPECTED_COLUMNS]

        # ✅ Step 3: Scale data using the full pipeline
        X_scaled = model.named_steps['preprocessor'].transform(df)

        # ✅ Step 4: Predict
        preds = model.named_steps['model'].predict(X_scaled)
        probs = model.named_steps['model'].predict_proba(X_scaled)[:, 1]

        # ✅ Step 5: Add predictions back to DataFrame
        df["Fraud_Prediction"] = preds
        df["Fraud_Probability"] = probs

        # Return top 5 predictions
        return {"predictions": df.head(5).to_dict(orient="records")}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
