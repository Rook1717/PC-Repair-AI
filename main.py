from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_service import diagnose_problem
from product_service import search_products


app = FastAPI(
    title="AI PC & Laptop Repair Assistant",
    description="AI-powered PC and laptop troubleshooting assistant",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DiagnosisRequest(BaseModel):
    problem: str
    device: str = ""


@app.get("/")
def home():
    return {
        "status": "success",
        "message": "AI PC & Laptop Repair Assistant is running."
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/diagnose")
def diagnose(request: DiagnosisRequest):

    problem = request.problem.strip()
    device = request.device.strip()

    if not problem:
        raise HTTPException(
            status_code=400,
            detail="Please enter a computer problem."
        )

    try:
        diagnosis = diagnose_problem(
            problem,
            device
        )

        if not isinstance(diagnosis, dict):
            raise ValueError(
                "AI returned an invalid diagnosis format."
            )

        diagnosis.setdefault(
            "title",
            "AI PC & Laptop Diagnosis"
        )

        diagnosis.setdefault(
            "summary",
            "The AI analyzed the reported problem."
        )

        diagnosis.setdefault(
            "confidence",
            "Not specified"
        )

        diagnosis.setdefault(
            "difficulty",
            "Not specified"
        )

        for field in [
            "possible_causes",
            "diagnosis_steps",
            "repair_steps",
            "tools_required",
            "parts_required",
            "safety",
            "when_to_visit_professional"
        ]:
            if not isinstance(diagnosis.get(field), list):
                diagnosis[field] = []

        products = []

        for part in diagnosis["parts_required"]:

            if isinstance(part, str):
                part_name = part
                search_query = part

            elif isinstance(part, dict):
                part_name = part.get(
                    "name",
                    "Required Component"
                )

                search_query = part.get(
                    "search_query",
                    ""
                )

            else:
                continue

            if not search_query:
                continue

            try:
                found_products = search_products(
                    str(search_query)
                )

                if not isinstance(found_products, list):
                    found_products = []

            except Exception as product_error:
                print(
                    f"Product search error for "
                    f"{search_query}: {product_error}"
                )

                found_products = []

            products.append({
                "component": str(part_name),
                "search_query": str(search_query),
                "products": found_products
            })

        return {
            "success": True,
            "diagnosis": diagnosis,
            "products": products
        }

    except HTTPException:
        raise

    except Exception as error:

        print("\n========== DIAGNOSIS ERROR ==========")
        print(type(error).__name__)
        print(str(error))
        print("=====================================\n")

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )