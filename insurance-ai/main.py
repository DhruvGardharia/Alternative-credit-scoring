"""
GigShield Insurance AI Microservice
FastAPI app — acts as the AI layer between Node.js backend and insurance catalog.

Endpoints:
  GET  /health           — health check
  GET  /catalog          — full insurance product catalog
  POST /recommend        — AI-ranked + explained plan recommendations
"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

import pickle
import pandas as pd
import warnings
import sklearn.compose._column_transformer as ct

# Fix for older sklearn models pickled with _RemainderColsList
class _RemainderColsList:
    pass
ct._RemainderColsList = _RemainderColsList

warnings.filterwarnings('ignore')

from insurer_catalog import INSURER_CATALOG
from ai_recommender import get_recommendations

load_dotenv()

app = FastAPI(
    title="GigShield Insurance AI Service",
    description="AI-powered insurance plan recommender for gig workers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ────────────────────────────────────────────────

class WorkerProfile(BaseModel):
    user_id: str = Field(..., description="MongoDB user ID")
    employment_type: str = Field("delivery", description="delivery | driver | freelancer")
    risk_score: int = Field(50, ge=0, le=100)
    risk_classification: str = Field("MEDIUM", description="LOW | MEDIUM | HIGH")
    avg_monthly_income: float = Field(15000, gt=0)
    work_stability_score: Optional[float] = Field(50.0)
    location_zone: Optional[str] = Field("urban")
    active_days_per_month: Optional[int] = Field(22)
    has_dependents: Optional[bool] = Field(False)
    top_n: Optional[int] = Field(3, ge=1, le=5, description="Number of recommendations to return")


class FilterParams(BaseModel):
    category: Optional[str] = None      # accident_health | equipment | health | income_protection | comprehensive
    max_daily_premium: Optional[float] = None
    min_coverage: Optional[float] = None


# ── Load Income Prediction Model & Schema ─────────────────────────────────────

MODEL_PATH = os.path.join(os.path.dirname(__file__), "gig_income_model.pkl")
try:
    with open(MODEL_PATH, "rb") as f:
        income_model = pickle.load(f)
except Exception as e:
    print(f"Warning: Could not load income prediction model: {e}")
    income_model = None

class GigWorkerIncomeData(BaseModel):
    platform: str = "Swiggy"
    age: int = 26
    gender: str = "Male"
    city: str = "Mumbai"
    area_type: str = "urban"
    years_of_experience: float = 3
    primary_skill: str = "delivery"
    skill_level: str = "intermediate"
    education_level: str = "graduate"
    owns_vehicle: int = 1
    number_of_vehicles: int = 1
    vehicle_type: str = "bike"
    vehicle_age_years: float = 2
    fuel_type: str = "petrol"
    platform_level: str = "silver"
    working_days_per_week: float = 6
    avg_hours_per_day: float = 6.5
    total_hours_worked_month: float = 170
    gigs_completed_month: float = 210
    acceptance_rate: float = 0.91
    cancellation_rate: float = 0.05
    peak_hours_work_ratio: float = 0.42
    platform_hours_ratio: float = 0.65
    avg_rating: float = 4.6
    total_reviews: float = 520
    repeat_customer_rate: float = 0.33
    response_time_minutes: float = 4
    base_pay_total: float = 22000
    tips_total: float = 2100
    bonus_earned: float = 3200
    surge_earnings: float = 900
    incentives_received: float = 700
    deductions: float = 500
    demand_index: float = 0.82
    season: str = "monsoon"
    festival_period: int = 0
    fuel_price_index: float = 104
    weather_condition: str = "rainy"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "GigShield Insurance AI",
        "plans_in_catalog": len(INSURER_CATALOG),
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.get("/catalog")
def get_catalog(
    category: Optional[str] = None,
    employment_type: Optional[str] = None,
    max_daily_premium: Optional[float] = None,
):
    """Return the full insurance product catalog with optional filters."""
    plans = INSURER_CATALOG.copy()

    if category:
        plans = [p for p in plans if p["category"] == category]
    if employment_type:
        plans = [p for p in plans if employment_type in p.get("target_workers", [])]
    if max_daily_premium:
        plans = [p for p in plans if p["premium"]["per_day"] <= max_daily_premium]

    return {
        "total": len(plans),
        "plans": plans,
        "providers": list({p["provider"] for p in plans}),
    }


@app.post("/recommend")
async def recommend(profile: WorkerProfile):
    """
    AI-powered insurance recommendation.

    Given a gig worker's profile, this endpoint:
    1. Filters catalog to eligible plans
    2. Uses Gemini to rank all plans by match score
    3. Generates plain-English explanation for top N plans
    4. Returns enriched recommendation cards
    """
    try:
        # Filter catalog by employment type first
        eligible_plans = [
            p for p in INSURER_CATALOG
            if profile.employment_type in p.get("target_workers", [])
               or "freelancer" in p.get("target_workers", [])
        ]

        if not eligible_plans:
            eligible_plans = INSURER_CATALOG  # fallback: show all

        # Build profile dict for AI
        profile_dict = profile.model_dump()
        profile_dict["avg_monthly_income"] = profile.avg_monthly_income

        # Run AI pipeline
        recommendations = await get_recommendations(
            profile=profile_dict,
            plans=eligible_plans,
            top_n=profile.top_n or 3,
        )

        # Build response
        return {
            "success": True,
            "worker_profile": {
                "employment_type": profile.employment_type,
                "risk_classification": profile.risk_classification,
                "risk_score": profile.risk_score,
                "avg_monthly_income": profile.avg_monthly_income,
                "location_zone": profile.location_zone,
            },
            "recommendations": recommendations,
            "total_plans_evaluated": len(eligible_plans),
            "methodology": {
                "stage_1": "Gemini 1.5 Flash scored each plan 0-100 based on worker profile match",
                "stage_2": "Gemini generated personalised plain-English explanation per top plan",
                "fallback": "Rule-based scoring used if Gemini API unavailable",
            },
            "disclaimer": (
                "GigShield is an insurance intermediary platform. "
                "All plans are underwritten by their respective IRDAI-registered insurers. "
                "Final premium may vary at purchase."
            ),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")


@app.get("/providers")
def get_providers():
    """List all insurance providers in the catalog."""
    providers = {}
    for p in INSURER_CATALOG:
        prov = p["provider"]
        if prov not in providers:
            providers[prov] = {
                "name": prov,
                "logo": p["provider_logo"],
                "irdai_registered": p["irdai_registered"],
                "rating": p["rating"],
                "plan_count": 0,
                "website": p["provider_website"],
            }
        providers[prov]["plan_count"] += 1

    return {"providers": list(providers.values())}


class IncomeBatchRequest(BaseModel):
    profiles: list[GigWorkerIncomeData]

@app.post("/predict_income")
def predict_income(data: IncomeBatchRequest):
    """
    Predict gig worker monthly income based on 38 input features, aggregated for multiple platforms.
    """
    if income_model is None:
        raise HTTPException(status_code=500, detail="Income prediction model not loaded.")
    
    try:
        if not data.profiles:
            return {"success": True, "predictions": [], "total_estimated_income": 0}

        # Pydantic model dump to list of dicts for Pandas DataFrame
        df = pd.DataFrame([p.model_dump() for p in data.profiles])
        preds = income_model.predict(df)
        
        results = [round(float(p), 2) for p in preds]
        return {
            "success": True, 
            "predictions": results,
            "total_estimated_income": round(sum(results), 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
