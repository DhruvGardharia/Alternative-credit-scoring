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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
