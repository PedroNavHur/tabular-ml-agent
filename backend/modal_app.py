import os
import io
import json
from typing import Any, Dict, Optional

import modal


image = (
    modal.Image.debian_slim(python_version="3.12")
    # Inline dependencies to avoid relying on an external requirements.txt
    .pip_install(
        "fastapi[standard]",
        "pydantic",
        "pandas",
        "numpy<2",
        "scikit-learn<1.6",
        "requests",
        "skops",
    )
    # propagate Convex URL to the container if set locally
    .env(
        {
            "CONVEX_URL": os.environ.get("CONVEX_URL")
            or os.environ.get("NEXT_PUBLIC_CONVEX_URL", ""),
        }
    )
)

app = modal.App("tabular-ml-agent-backend", image=image)
# Reads Convex URL from a Modal Secret named "tabular-ml-agent-backend"
# with key NEXT_PUBLIC_CONVEX_URL or CONVEX_URL
convex_env = modal.Secret.from_name("tabular-ml-agent-backend")


def _http_post(url: str, payload: Dict[str, Any], secret: str) -> None:
    import requests

    headers = {"x-webhook-secret": secret, "content-type": "application/json"}
    resp = requests.post(url, headers=headers, data=json.dumps(payload))
    resp.raise_for_status()


def _http_post_json(url: str, json_payload: Dict[str, Any], secret: str) -> Dict[str, Any]:
    import requests

    headers = {"x-webhook-secret": secret}
    resp = requests.post(url, headers=headers, json=json_payload)
    resp.raise_for_status()
    return resp.json()


def _download_text(url: str) -> str:
    import requests

    r = requests.get(url)
    r.raise_for_status()
    return r.text


def preprocess_csv(
    csv_text: str,
    target: Optional[str],
    id_column: Optional[str],
    missing: str,
) -> Dict[str, Any]:
    import pandas as pd
    from pandas.api.types import is_numeric_dtype

    df = pd.read_csv(io.StringIO(csv_text))
    original_shape = df.shape

    applied: Dict[str, Any] = {"dropped_columns": [], "imputations": {}}

    # Drop ID column if provided
    if id_column and id_column in df.columns:
        df = df.drop(columns=[id_column])
        applied["dropped_columns"].append(id_column)

    # Handle missing values
    if missing == "drop":
        before = len(df)
        df = df.dropna()
        applied["dropna_rows"] = before - len(df)
    else:
        for col in df.columns:
            if col == target:
                continue
            if df[col].isna().any():
                if missing == "auto":
                    if is_numeric_dtype(df[col]):
                        val = float(df[col].median())
                        df[col] = df[col].fillna(val)
                        applied["imputations"][col] = {"strategy": "median", "value": val}
                    else:
                        mode = df[col].mode(dropna=True)
                        val = (mode.iloc[0] if not mode.empty else "")
                        df[col] = df[col].fillna(val)
                        applied["imputations"][col] = {"strategy": "most_frequent", "value": val}
                elif missing in {"mean", "median"} and is_numeric_dtype(df[col]):
                    if missing == "mean":
                        val = float(df[col].mean())
                        strat = "mean"
                    else:
                        val = float(df[col].median())
                        strat = "median"
                    df[col] = df[col].fillna(val)
                    applied["imputations"][col] = {"strategy": strat, "value": val}
                elif missing == "most_frequent":
                    mode = df[col].mode(dropna=True)
                    val = (mode.iloc[0] if not mode.empty else "")
                    df[col] = df[col].fillna(val)
                    applied["imputations"][col] = {"strategy": "most_frequent", "value": val}

    # Build summary
    summary = {
        "shape_before": list(original_shape),
        "shape_after": list(df.shape),
        "columns": list(df.columns),
        "target": target,
        "applied": applied,
        "missing_counts": {c: int(df[c].isna().sum()) for c in df.columns},
        "dtypes": {c: str(dt) for c, dt in df.dtypes.to_dict().items()},
    }

    # Produce processed CSV bytes
    out_buf = io.StringIO()
    df.to_csv(out_buf, index=False)
    processed_csv = out_buf.getvalue().encode("utf-8")
    return {"processed_csv": processed_csv, "summary": summary}


def profile_csv(csv_text: str, target: Optional[str]) -> Dict[str, Any]:
    import pandas as pd

    df = pd.read_csv(io.StringIO(csv_text))
    profile: Dict[str, Any] = {
        "n_rows": int(df.shape[0]),
        "n_cols": int(df.shape[1]),
        "columns": list(df.columns),
        "target": target,
        "na_by_col": {c: int(df[c].isna().sum()) for c in df.columns},
        "describe": json.loads(df.describe(include="all").fillna(0).to_json()),
    }
    return profile


@app.function(image=image, secrets=[convex_env])
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel

    web_app = FastAPI()

    @web_app.get("/health")
    async def health():
        return {"ok": True}

    class Callbacks(BaseModel):
        running: str
        complete: str
        fail: str
        saveProfile: str
        uploadUrl: str

    class Params(BaseModel):
        target: Optional[str] = None
        idColumn: Optional[str] = None
        taskType: str
        missing: str
        testSize: float

    class PreprocessRequest(BaseModel):
        runId: str
        datasetId: str
        params: Params
        callbacks: Callbacks
        secret: str

    @web_app.post("/preprocess")
    async def preprocess(req: PreprocessRequest):
        secret = req.secret
        try:
            # 1) Mark running
            _http_post(req.callbacks.running, {"runId": req.runId}, secret)

            # 2) Fetch original CSV URL via Convex HTTP helper
            convex_url = os.environ.get("CONVEX_URL") or os.environ.get("NEXT_PUBLIC_CONVEX_URL")
            if not convex_url:
                raise HTTPException(status_code=500, detail="Missing CONVEX_URL/NEXT_PUBLIC_CONVEX_URL")
            dataset_url_resp = _http_post_json(
                f"{convex_url}/dataset/download-url",
                {"datasetId": req.datasetId},
                secret,
            )
            original_url = dataset_url_resp.get("url")
            if not original_url:
                raise HTTPException(status_code=500, detail="Failed to get original dataset URL")

            # 3) Download CSV
            csv_text = _download_text(original_url)

            # 4) Preprocess
            processed = preprocess_csv(
                csv_text,
                target=req.params.target,
                id_column=req.params.idColumn,
                missing=req.params.missing,
            )

            # 5) Upload processed CSV to Convex storage
            upload_resp = _http_post_json(req.callbacks.uploadUrl, {}, secret)
            upload_url = upload_resp.get("url")
            if not upload_url:
                raise HTTPException(status_code=500, detail="Failed to get upload URL")

            import requests

            processed_filename = f"{req.datasetId}-processed.csv"
            processed_csv = processed["processed_csv"] if isinstance(processed, dict) else processed["processed_csv"]
            r = requests.post(
                upload_url,
                headers={"content-type": "text/csv"},
                data=processed_csv,
            )
            r.raise_for_status()
            storage_id = r.json().get("storageId")
            if not storage_id:
                raise HTTPException(status_code=500, detail="Upload response missing storageId")

            # 6) Mark complete with summary
            summary = processed.get("summary", {}) if isinstance(processed, dict) else {}
            _http_post(
                req.callbacks.complete,
                {
                    "runId": req.runId,
                    "processedStorageId": storage_id,
                    "processedFilename": processed_filename,
                    "summary": summary,
                },
                secret,
            )

            # 7) Profile (optional for MVP)
            profile = profile_csv(csv_text, req.params.target)
            _http_post(
                req.callbacks.saveProfile,
                {"datasetId": req.datasetId, "report": profile, "runId": req.runId},
                secret,
            )

            return {"ok": True}
        except Exception as e:
            try:
                _http_post(req.callbacks.fail, {"runId": req.runId, "error": str(e)}, secret)
            except Exception:
                pass
            raise

    return web_app


@app.function(image=image, secrets=[convex_env])
@modal.asgi_app()
def training_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel

    web_app = FastAPI()

    class Callbacks(BaseModel):
        uploadUrl: str
        saveModel: str | None = None

    class TrainRequest(BaseModel):
        datasetId: str
        runCfgId: str | None = None
        csvUrl: str
        cfg: dict
        secret: str
        callbacks: Callbacks

    @web_app.post("/train")
    async def train(req: TrainRequest):
        import pandas as pd
        import requests
        from io import BytesIO
        from sklearn.compose import ColumnTransformer
        from sklearn.preprocessing import OneHotEncoder, StandardScaler, MinMaxScaler, RobustScaler
        from sklearn.pipeline import Pipeline
        from sklearn.model_selection import cross_val_score
        from sklearn.metrics import make_scorer, balanced_accuracy_score, mean_absolute_error
        from skops.io import dumps as skops_dumps

        r = requests.get(req.csvUrl)
        r.raise_for_status()
        df = pd.read_csv(BytesIO(r.content))

        cfg = req.cfg or {}
        target = cfg.get("target")
        if not target or target not in df.columns:
            raise HTTPException(status_code=400, detail="Invalid or missing target in cfg")
        task_type = cfg.get("task_type", "classification")
        preprocessing = cfg.get("preprocessing", {})
        models = cfg.get("models", [])
        cv_cfg = cfg.get("cv", {"cv_folds": 5, "shuffle": True, "random_state": 42})

        X = df.drop(columns=[target])
        y = df[target]
        num_cols = X.select_dtypes(include=["number"]).columns.tolist()
        cat_cols = [c for c in X.columns if c not in num_cols]

        scaler_name = preprocessing.get("scaler", "none")
        scaler = None
        if scaler_name == "StandardScaler":
            scaler = StandardScaler()
        elif scaler_name == "MinMaxScaler":
            scaler = MinMaxScaler()
        elif scaler_name == "RobustScaler":
            scaler = RobustScaler()

        transformers = []
        if cat_cols:
            transformers.append(("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols))
        if num_cols:
            if scaler is not None:
                transformers.append(("num", scaler, num_cols))
            else:
                transformers.append(("num", "passthrough", num_cols))
        preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")

        from sklearn.linear_model import LogisticRegression, LinearRegression
        from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
        from sklearn.svm import SVC, SVR

        registry = {
            "LogisticRegression": LogisticRegression,
            "RandomForestClassifier": RandomForestClassifier,
            "GradientBoostingClassifier": GradientBoostingClassifier,
            "SVC": SVC,
            "LinearRegression": LinearRegression,
            "RandomForestRegressor": RandomForestRegressor,
            "GradientBoostingRegressor": GradientBoostingRegressor,
            "SVR": SVR,
        }

        if task_type == "regression":
            scorer = make_scorer(mean_absolute_error, greater_is_better=False)
            metric_name = "mae"
        else:
            scorer = make_scorer(balanced_accuracy_score)
            metric_name = "balanced_accuracy"

        results = []
        for m in models:
            name = m.get("name")
            params = m.get("params", {})
            if name not in registry:
                continue
            ModelCls = registry[name]
            try:
                inst = ModelCls()
                if hasattr(inst, "random_state"):
                    params.setdefault("random_state", 42)
            except Exception:
                pass
            model = ModelCls(**params)
            pipe = Pipeline(steps=[("prep", preprocessor), ("model", model)])
            scores = cross_val_score(pipe, X, y, cv=cv_cfg.get("cv_folds", 5), scoring=scorer)
            mean_score = float(scores.mean())
            std_score = float(scores.std())
            pipe.fit(X, y)
            try:
                blob = skops_dumps(pipe)
            except Exception:
                blob = None
            upload_info = _http_post_json(req.callbacks.uploadUrl, {}, req.secret)
            upload_url = upload_info.get("url")
            if not upload_url:
                raise HTTPException(status_code=500, detail="Failed to get upload URL")
            ur = requests.post(upload_url, headers={"content-type": "application/octet-stream"}, data=blob)
            ur.raise_for_status()
            storage_id = ur.json().get("storageId")
            metrics = {metric_name: mean_score, f"{metric_name}_std": std_score}
            if req.callbacks.saveModel:
                _http_post(req.callbacks.saveModel, {
                    "datasetId": req.datasetId,
                    "runCfgId": req.runCfgId,
                    "modelName": name,
                    "storageId": storage_id,
                    "metrics": metrics,
                }, req.secret)
            results.append({"model": name, "storageId": storage_id, "metrics": metrics})

        return {"ok": True, "results": results}

    return web_app


@app.function(image=image, secrets=[convex_env])
@modal.asgi_app()
def predict_app():
    from fastapi import FastAPI, HTTPException
    from pydantic import BaseModel

    web_app = FastAPI()

    class PredictRequest(BaseModel):
        modelUrl: str
        X: list[dict]

    @web_app.post("/predict")
    async def predict(req: PredictRequest):
        import requests
        import pandas as pd
        from skops.io import loads as skops_loads, get_untrusted_types
        import numpy as np  # noqa: F401

        r = requests.get(req.modelUrl)
        r.raise_for_status()
        try:
            trusted = list(get_untrusted_types(r.content))
        except Exception:
            trusted = []
        extra = ["sklearn.compose._column_transformer._RemainderColsList"]
        for t in extra:
            if t not in trusted:
                trusted.append(t)
        model = skops_loads(r.content, trusted=trusted)
        X_list = req.X if isinstance(req.X, list) else [req.X]
        df = pd.DataFrame(X_list)
        try:
            y_pred = model.predict(df).tolist()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"predict failed: {e}")
        proba = None
        if hasattr(model, "predict_proba"):
            try:
                proba = getattr(model, "predict_proba")(df).tolist()
            except Exception:
                proba = None
        return {"predictions": y_pred, "probabilities": proba}

    return web_app
