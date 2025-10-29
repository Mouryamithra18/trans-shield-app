# train.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, roc_auc_score
import joblib
import os
print("✅ train.py started running...")

# STEP 1: Load the dataset
data = pd.read_csv("creditcard.csv")

# STEP 2: Separate features (X) and target (y)
X = data.drop(columns=["Class"])
y = data["Class"]

# STEP 3: Preprocessing pipeline
numeric_features = X.columns
num_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])
preprocessor = ColumnTransformer([
    ("num", num_pipeline, numeric_features)
])

# STEP 4: Model definition
model = RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced')

pipe = Pipeline([
    ("preprocessor", preprocessor),
    ("model", model)
])

# STEP 5: Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# STEP 6: Train the model
pipe.fit(X_train, y_train)

# STEP 7: Evaluate model
y_pred = pipe.predict(X_test)
y_proba = pipe.predict_proba(X_test)[:, 1]

print("✅ MODEL TRAINED SUCCESSFULLY ✅\n")
print("Classification Report:")
print(classification_report(y_test, y_pred))
print("ROC AUC SCORE:", roc_auc_score(y_test, y_proba))

# STEP 8: Save the model and scaler
os.makedirs("models", exist_ok=True)
joblib.dump(pipe, "models/fraud_model.joblib")
joblib.dump(pipe.named_steps['preprocessor'].named_transformers_['num'].named_steps['scaler'], "models/scaler.joblib")
print("\n✅ Model saved as models/fraud_model.joblib")
print("✅ Scaler saved as models/scaler.joblib")
