from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd
from flask import Flask, Response, jsonify, request, send_from_directory

import app as legacy
from demand_planning_app import service as service_module


app = Flask(__name__)
ROOT_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = ROOT_DIR / "public"

ORIGINAL_LOAD_SAVED_FORECAST_SETTINGS = legacy.load_saved_forecast_settings
ORIGINAL_GET_SAVED_FORECAST_SETTING = legacy.get_saved_forecast_setting
ORIGINAL_GET_SAVED_UPLIFT_PCT = legacy.get_saved_uplift_pct
ORIGINAL_LOAD_SAVED_UPLIFT_MAP = legacy.load_saved_uplift_map
ORIGINAL_SAVE_FORECAST_SETTING_FOR_MONTH = legacy.save_forecast_setting_for_month


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if hasattr(value, "item"):
        return value.item()
    return value


def _json_safe_deep(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _json_safe_deep(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe_deep(item) for item in value]
    return _json_safe(value)


@lru_cache(maxsize=1)
def _firebase_db():
    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
    if not raw:
        return None

    import firebase_admin
    from firebase_admin import credentials, firestore

    parsed = json.loads(raw)
    if isinstance(parsed.get("private_key"), str):
        parsed["private_key"] = parsed["private_key"].replace("\\n", "\n")

    app_name = "demand-planning-flask"
    try:
        firebase_app = firebase_admin.get_app(app_name)
    except ValueError:
        firebase_app = firebase_admin.initialize_app(
            credentials.Certificate(parsed),
            {"projectId": parsed.get("project_id")},
            name=app_name,
        )
    return firestore.client(app=firebase_app)


def _load_forecast_settings_firestore(
    _path: str | os.PathLike[str] | None = None,
    *,
    fallback_mix: dict[str, float] | None = None,
) -> dict[str, dict[str, Any]]:
    db = _firebase_db()
    if db is None:
        return ORIGINAL_LOAD_SAVED_FORECAST_SETTINGS(legacy.FORECAST_DEFAULTS_PATH, fallback_mix=fallback_mix)

    docs = db.collection("forecastSettings").stream()
    settings: dict[str, dict[str, Any]] = {}
    for doc in docs:
        data = doc.to_dict() or {}
        month_key = str(data.get("yearMonth") or doc.id).strip()
        if len(month_key) != 7:
            continue
        settings[month_key] = {
            "upliftPct": float(data.get("upliftPct", 0.0) or 0.0),
            "productMix": data.get("productMix") or dict(fallback_mix or {}),
        }
    return settings


def _get_forecast_setting_firestore(
    _path: str | os.PathLike[str],
    horizon_start: str | pd.Timestamp,
    *,
    fallback: float = legacy.DEFAULT_UPLIFT_PCT if hasattr(legacy, "DEFAULT_UPLIFT_PCT") else 35.0,
    fallback_mix: dict[str, float] | None = None,
) -> dict[str, Any]:
    month_key = pd.Timestamp(horizon_start).strftime("%Y-%m")
    settings = _load_forecast_settings_firestore()
    if month_key in settings:
        return settings[month_key]
    return {
        "upliftPct": float(fallback),
        "productMix": dict(fallback_mix or {}),
    }


def _get_saved_uplift_pct_firestore(
    path: str | os.PathLike[str], horizon_start: str | pd.Timestamp, *, fallback: float = 35.0
) -> float:
    setting = _get_forecast_setting_firestore(path, horizon_start, fallback=fallback)
    return float(setting.get("upliftPct", fallback) or fallback)


def _load_saved_uplift_map_firestore(path: str | os.PathLike[str]) -> dict[str, float]:
    settings = _load_forecast_settings_firestore(path)
    return {str(key): float(value.get("upliftPct", 0.0) or 0.0) for key, value in settings.items()}


def _save_forecast_setting_firestore(
    _path: str | os.PathLike[str],
    horizon_start: str | pd.Timestamp,
    *,
    uplift_pct: float,
    product_mix: dict[str, Any] | None = None,
) -> dict[str, Any]:
    month_key = pd.Timestamp(horizon_start).strftime("%Y-%m")
    payload = {
        "yearMonth": month_key,
        "upliftPct": float(uplift_pct),
        "productMix": product_mix or {},
    }
    db = _firebase_db()
    if db is None:
        ORIGINAL_SAVE_FORECAST_SETTING_FOR_MONTH(
            legacy.FORECAST_DEFAULTS_PATH,
            horizon_start,
            uplift_pct=uplift_pct,
            product_mix=product_mix,
        )
        return {"months": ORIGINAL_LOAD_SAVED_FORECAST_SETTINGS(legacy.FORECAST_DEFAULTS_PATH)}
    db.collection("forecastSettings").document(month_key).set(payload, merge=True)
    return {"months": _load_forecast_settings_firestore()}


legacy.load_saved_forecast_settings = _load_forecast_settings_firestore
legacy.get_saved_forecast_setting = _get_forecast_setting_firestore
legacy.get_saved_uplift_pct = _get_saved_uplift_pct_firestore
legacy.load_saved_uplift_map = _load_saved_uplift_map_firestore
legacy.save_forecast_setting_for_month = _save_forecast_setting_firestore


@app.after_request
def _disable_cache(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.get("/api/workspace")
def api_workspace():
    return jsonify(_json_safe_deep(legacy.workspace_payload()))


@app.get("/api/tiktok-kpis")
def api_tiktok_kpis():
    query = {key: request.args.getlist(key) for key in request.args.keys()}
    return jsonify(_json_safe_deep(legacy.filtered_tiktok_kpi_payload(query)))


@app.get("/api/inventory-template.csv")
def api_inventory_template():
    text = legacy.inventory_template_csv()
    return Response(
        text,
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="inventory-template.csv"'},
    )


@app.post("/api/load-sample")
def api_load_sample():
    legacy.load_sample_state()
    return jsonify({"ok": True, "workspace": _json_safe_deep(legacy.workspace_payload())})


@app.post("/api/upload/orders")
def api_upload_orders():
    return jsonify({"error": "Hosted uploads are not enabled yet for this deployment."}), 501


@app.post("/api/upload/samples")
def api_upload_samples():
    return jsonify({"error": "Hosted uploads are not enabled yet for this deployment."}), 501


@app.post("/api/upload/inventory")
def api_upload_inventory():
    return jsonify({"error": "Hosted uploads are not enabled yet for this deployment."}), 501


@app.post("/api/plan")
def api_plan():
    legacy.ensure_state()
    params = request.get_json(silent=True) or {}
    if legacy.STATE.daily_demand is None or legacy.STATE.daily_demand.empty:
        return jsonify({"error": "Load sample data or upload All orders first."}), 400

    horizon_start = str(params.get("horizonStart") or "")
    uplift_pct = float(params.get("upliftPct") or 0)
    monthly_uplift_pcts = {
        str(key): float(value)
        for key, value in (params.get("monthlyForecastPcts") or {}).items()
        if str(key).strip()
    }
    monthly_forecast_settings = {
        str(key): value
        for key, value in (params.get("monthlyForecastSettings") or {}).items()
        if str(key).strip() and isinstance(value, dict)
    }
    saved_forecast_settings = legacy.load_saved_forecast_settings(legacy.FORECAST_DEFAULTS_PATH)
    runtime_forecast_settings = dict(saved_forecast_settings)
    for key, value in monthly_forecast_settings.items():
        runtime_forecast_settings[str(key)] = {
            "upliftPct": float(value.get("upliftPct", monthly_uplift_pcts.get(key, uplift_pct))),
            "productMix": value.get("productMix") or {},
        }
    payload = legacy.run_planning_workspace(
        orders=legacy.STATE.orders,
        samples=legacy.STATE.samples,
        inventory=legacy.STATE.inventory,
        daily_demand=legacy.STATE.daily_demand,
        sample_daily_demand=legacy.STATE.samples_daily_demand,
        baseline_start=str(params.get("baselineStart") or ""),
        baseline_end=str(params.get("baselineEnd") or ""),
        horizon_start=horizon_start,
        horizon_end=str(params.get("horizonEnd") or ""),
        velocity_mode=str(params.get("velocityMode") or "sales_only"),
        default_uplift_pct=uplift_pct,
        default_lead_time_days=int(params.get("leadTimeDays") or 8),
        default_safety_days=int(params.get("safetyDays") or 0),
        monthly_uplift_pcts=monthly_uplift_pcts,
        monthly_forecast_settings=runtime_forecast_settings,
        planning_year=int(params.get("planningYear") or pd.Timestamp(horizon_start).year),
    )
    return jsonify({"ok": True, **_json_safe_deep(payload)})


@app.post("/api/forecast-settings")
def api_forecast_settings():
    legacy.ensure_state()
    params = request.get_json(silent=True) or {}
    month_key = str(params.get("monthKey") or "").strip()
    setting = params.get("setting") or {}
    if not setting:
        setting = {
            "upliftPct": params.get("upliftPct", 0.0),
            "productMix": params.get("productMix") or {},
        }
    if not month_key or len(month_key) != 7:
        return jsonify({"error": "Month key is required."}), 400
    legacy.save_forecast_setting_for_month(
        legacy.FORECAST_DEFAULTS_PATH,
        f"{month_key}-01",
        uplift_pct=float(setting.get("upliftPct", 0.0)),
        product_mix=setting.get("productMix") or {},
    )
    return jsonify(
        {
            "ok": True,
            "forecastSettings": _json_safe_deep(legacy.load_saved_forecast_settings(legacy.FORECAST_DEFAULTS_PATH)),
            "activeSetting": _json_safe_deep(legacy.get_saved_forecast_setting(legacy.FORECAST_DEFAULTS_PATH, f"{month_key}-01")),
        }
    )


@app.get("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")


@app.get("/<path:path>")
def static_files(path: str):
    target = PUBLIC_DIR / path
    if target.exists() and target.is_file():
        return send_from_directory(PUBLIC_DIR, path)
    return ("Not Found", 404)
