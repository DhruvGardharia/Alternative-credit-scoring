# 🛡️ GigShield Insurance AI Microservice

FastAPI-based AI service that powers insurance plan recommendations for gig workers. Uses **Groq (LLaMA)** to rank and explain insurance plans based on a worker's risk profile.

## Prerequisites

- **Python 3.10+** (tested with 3.12)
- **Groq API Key** — get one free at [console.groq.com](https://console.groq.com)

## Quick Start

### 1. Navigate to the directory

```bash
cd insurance-ai
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate          # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up environment variables

Create a `.env` file in the `insurance-ai/` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Start the server

```bash
uvicorn main:app --reload --port 8000
```

The server will start at **http://localhost:8000**.

## API Endpoints

| Method | Endpoint     | Description                                  |
|--------|-------------|----------------------------------------------|
| GET    | `/health`    | Health check & config status                 |
| GET    | `/catalog`   | Browse full insurance product catalog        |
| POST   | `/recommend` | AI-ranked plan recommendations for a worker  |
| GET    | `/providers` | List all insurance providers                 |

### Interactive API Docs

Once running, visit **http://localhost:8000/docs** for the Swagger UI.

## Example: Get Recommendations

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "abc123",
    "employment_type": "delivery",
    "risk_score": 55,
    "risk_classification": "MEDIUM",
    "avg_monthly_income": 18000,
    "top_n": 3
  }'
```

## Project Structure

```
insurance-ai/
├── main.py              # FastAPI app & endpoints
├── ai_recommender.py    # Groq/LLM recommendation pipeline
├── insurer_catalog.py   # Insurance product catalog (8 plans, 5 providers)
├── requirements.txt     # Python dependencies
└── .env                 # API keys (not committed)
```

## How It Integrates

This microservice is called by the **Node.js backend** at `GET /api/insurance/recommendations`. The flow is:

```
Frontend (MicroInsurance.jsx)
  → Node.js Backend (/api/insurance/recommendations)
    → This FastAPI Service (/recommend)
      → Groq AI (LLaMA 3) for scoring & explanations
```

> **Note:** The main app gracefully degrades if this service is unavailable — users will see a "service starting up" message instead of an error.
