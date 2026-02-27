"""
AI Recommender — Groq-powered (Llama 3.3) insurance plan matching & plain-English explanation.

Two-stage pipeline:
  1. RANKING  – LLM scores each plan 0-100 for this specific worker profile
  2. EXPLAIN  – LLM writes a personalised plain-English explanation per top plan

Uses Groq API (Llama 3.3 70B) — 14,400 free requests/day, sub-second inference.
"""

import json
import os
import re
import asyncio
from typing import Optional

from groq import Groq
from dotenv import load_dotenv

load_dotenv()
_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

# Models
TEXT_MODEL = "llama-3.3-70b-versatile"

# Rate-limit: generous on Groq free tier but still be polite
_RATE_LIMIT_DELAY = 2


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_json(text: str):
    """Extract JSON from LLM response (handles ```json blocks and extra trailing text)."""
    text = text.strip()
    # Strip markdown code fences
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        text = match.group(1).strip()
    # Find the start of JSON
    for i, ch in enumerate(text):
        if ch in ('[', '{'):
            decoder = json.JSONDecoder()
            result, _ = decoder.raw_decode(text, i)
            return result
    return json.loads(text)



def _call_groq(prompt: str) -> str:
    """Call Groq LLM and return the response text."""
    chat_completion = _client.chat.completions.create(
        messages=[
            {"role": "system", "content": "You are a helpful AI insurance advisor. Always respond with valid JSON only, no extra text."},
            {"role": "user", "content": prompt},
        ],
        model=TEXT_MODEL,
        temperature=0.3,
        max_tokens=2048,
    )
    return chat_completion.choices[0].message.content


def _worker_summary(profile: dict) -> str:
    income = profile.get("avg_monthly_income", 15000)
    risk = profile.get("risk_classification", "MEDIUM")
    emp = profile.get("employment_type", "delivery")
    score = profile.get("risk_score", 55)
    zone = profile.get("location_zone", "urban")
    stability = profile.get("work_stability_score", 50)
    return (
        f"Worker Profile:\n"
        f"- Type: {emp} worker\n"
        f"- Monthly Income: ₹{income:,}\n"
        f"- Risk Score: {score}/100 ({risk} risk)\n"
        f"- Work Stability: {stability}/100\n"
        f"- Location: {zone} zone\n"
    )


# ── Stage 1: Rank plans (1 API call for all plans) ───────────────────────────

async def rank_plans(profile: dict, plans: list) -> list[dict]:
    worker_text = _worker_summary(profile)
    plans_text = "\n".join(
        f"- plan_id: {p['plan_id']} | name: {p['plan_name']} | "
        f"category: {p['category']} | targets: {p['target_workers']} | "
        f"per_day: ₹{p['premium']['per_day']} | coverage: ₹{p['coverage_amount']:,} | "
        f"best_for: {p.get('best_for','')}"
        for p in plans
    )

    prompt = f"""You are an AI insurance advisor for an Indian gig worker platform.

{worker_text}

Available insurance plans:
{plans_text}

Score EACH plan from 0 to 100 based on how well it matches this specific worker.
Consider: employment type match, affordability (income vs premium), coverage needs, risk level.

Respond ONLY with a valid JSON array (no extra text):
[
  {{
    "plan_id": "PLAN_ID",
    "match_score": <integer 0-100>,
    "why_it_fits": "<one sentence, max 15 words, personalised>"
  }}
]"""

    try:
        text = _call_groq(prompt)
        rankings = _extract_json(text)
        assert all("plan_id" in r and "match_score" in r for r in rankings)
        return rankings
    except Exception as e:
        print(f"Groq ranking failed ({e}), using rule-based fallback")
        return _rule_based_ranking(profile, plans)


def _rule_based_ranking(profile: dict, plans: list) -> list[dict]:
    emp = profile.get("employment_type", "delivery")
    income = profile.get("avg_monthly_income", 15000)
    risk = profile.get("risk_classification", "MEDIUM")

    results = []
    for p in plans:
        score = 50
        if emp in p.get("target_workers", []):
            score += 20
        daily = p["premium"]["per_day"]
        daily_income = income / 30
        if daily / daily_income < 0.002:
            score += 15
        elif daily / daily_income < 0.004:
            score += 8
        if risk == "HIGH" and p["coverage_amount"] >= 300000:
            score += 10
        elif risk == "LOW" and p["premium"]["per_day"] <= 20:
            score += 10
        results.append({
            "plan_id": p["plan_id"],
            "match_score": min(score, 99),
            "why_it_fits": f"Good match for {emp} workers with {risk.lower()} risk profile.",
        })
    return results


# ── Stage 2: Explain top plans (1 API call each, sequential) ─────────────────

async def explain_plan(profile: dict, plan: dict, match_score: int, why_it_fits: str) -> dict:
    worker_text = _worker_summary(profile)
    emp = profile.get("employment_type", "delivery")

    prompt = f"""You are a friendly insurance advisor helping a gig worker in India understand an insurance plan.
Use simple, everyday language. Avoid jargon. Imagine explaining to a friend who has never bought insurance.

{worker_text}

Plan Details:
- Name: {plan['plan_name']} by {plan['provider']}
- Daily Premium: ₹{plan['premium']['per_day']}
- Coverage: ₹{plan['coverage_amount']:,}
- What it covers: {', '.join(plan['inclusions'][:4])}
- What it does NOT cover: {', '.join(plan['exclusions'][:3])}
- How to claim: {plan['claim_process']}
- Best for: {plan.get('best_for', '')}

Write a personalised explanation tailored for a {emp} worker. Be warm, practical, and clear.

Respond ONLY with valid JSON (no extra text):
{{
  "plain_explanation": "<2-3 sentences explaining the plan like a friend would>",
  "simple_what_covered": ["<short point 1>", "<short point 2>", "<short point 3>"],
  "simple_what_not_covered": ["<short point 1>", "<short point 2>"],
  "simple_how_to_claim": "<one sentence, very practical>",
  "bottom_line": "<one sentence: should this worker buy it? why?>",
  "affordability_note": "<one sentence comparing ₹{plan['premium']['per_day']}/day to their ₹{profile.get('avg_monthly_income',15000)/30:.0f}/day income>"
}}"""

    try:
        text = _call_groq(prompt)
        explanation = _extract_json(text)
        return explanation
    except Exception as e:
        print(f"Groq explanation failed ({e}), using fallback")
        return _fallback_explanation(plan, profile)


def _fallback_explanation(plan: dict, profile: dict) -> dict:
    income = profile.get("avg_monthly_income", 15000)
    daily_income = income / 30
    daily_premium = plan["premium"]["per_day"]
    pct = (daily_premium / daily_income) * 100

    return {
        "plain_explanation": (
            f"{plan['plan_name']} gives you ₹{plan['coverage_amount']:,} coverage "
            f"for just ₹{daily_premium}/day. If you get into an accident, "
            f"this plan pays your medical bills so you don't go into debt."
        ),
        "simple_what_covered": plan["inclusions"][:3],
        "simple_what_not_covered": plan["exclusions"][:2],
        "simple_how_to_claim": plan["claim_process"],
        "bottom_line": f"A solid safety net for your work — only {pct:.1f}% of your daily earnings.",
        "affordability_note": (
            f"At ₹{daily_premium}/day, it's {pct:.1f}% of your ~₹{daily_income:.0f} daily income."
        ),
    }


# ── Main pipeline ─────────────────────────────────────────────────────────────

async def get_recommendations(profile: dict, plans: list, top_n: int = 3) -> list[dict]:
    """
    Full pipeline: rank all plans → explain top N → return enriched list.
    Sequential with 2s gap to be polite to Groq free tier (14,400 req/day).
    """
    # Stage 1: rank (1 call)
    rankings = await rank_plans(profile, plans)

    score_map = {r["plan_id"]: r for r in rankings}
    scored_plans = []
    for p in plans:
        r = score_map.get(p["plan_id"], {"match_score": 40, "why_it_fits": "General match"})
        scored_plans.append((p, r["match_score"], r["why_it_fits"]))

    scored_plans.sort(key=lambda x: x[1], reverse=True)
    top_plans = scored_plans[:top_n]

    # Stage 2: explain SEQUENTIALLY with delay
    results = []
    for i, (plan, score, why) in enumerate(top_plans):
        if i > 0:
            await asyncio.sleep(_RATE_LIMIT_DELAY)
        explanation = await explain_plan(profile, plan, score, why)
        results.append({
            "plan": plan,
            "match_score": score,
            "why_it_fits": why,
            "ai_explanation": explanation,
            "rank": i + 1,
        })

    return results
