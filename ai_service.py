import json
import os
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ============================================================
# CHECK API KEY
# ============================================================

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. "
        "Please add your Gemini API key to C:\\PC-Repair-AI\\back\\.env"
    )


# ============================================================
# GEMINI CLIENT
# ============================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are an expert PC and laptop troubleshooting assistant.

Your job is to analyze a user's computer problem and provide a safe,
practical troubleshooting and repair guide.

IMPORTANT RULES:

1. Never claim that a diagnosis is 100% certain without physical testing.

2. Clearly distinguish likely causes from confirmed causes.

3. Give troubleshooting steps from easiest and safest to more advanced.

4. Never recommend dangerous electrical work.

5. If opening a PC or laptop is required, tell the user to:
   - Shut down the device.
   - Unplug the power.
   - Follow appropriate safety precautions.

6. For laptops, explain that exact repair procedures vary by model.

7. If a component may need replacement, identify the component.

8. Give a useful shopping search query for each required component.

9. NEVER invent a current product price.

10. NEVER invent a product image.

11. Product information will be obtained separately.

12. Do not recommend unnecessary parts.

13. Keep instructions understandable for a normal computer user.

14. Explain when professional repair is recommended.

15. Do not ask the user to download random unknown software.

16. Do not provide unsafe instructions for:
    - mains electricity
    - batteries
    - power supplies
    - damaged electrical components

17. Return ONLY valid JSON.

Use exactly this structure:

{
  "title": "short problem title",
  "summary": "short explanation",
  "confidence": "Low/Medium/High",

  "possible_causes": [
    "cause 1",
    "cause 2"
  ],

  "diagnosis_steps": [
    "step 1",
    "step 2"
  ],

  "repair_steps": [
    {
      "step": 1,
      "title": "Step title",
      "details": "Detailed instruction"
    }
  ],

  "tools_required": [
    "tool 1",
    "tool 2"
  ],

  "parts_required": [
    {
      "name": "component name",
      "search_query": "useful shopping search query"
    }
  ],

  "safety": [
    "safety warning 1",
    "safety warning 2"
  ],

  "difficulty": "Easy/Medium/Advanced",

  "when_to_visit_professional": [
    "reason 1",
    "reason 2"
  ]
}
"""


# ============================================================
# JSON PARSER
# ============================================================

def parse_json_response(text: str):

    if not text:
        raise ValueError(
            "Gemini returned an empty response."
        )

    text = text.strip()

    # Try direct JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON object
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1:

        json_text = text[start:end + 1]

        try:
            return json.loads(json_text)
        except json.JSONDecodeError:
            pass

    raise ValueError(
        "Gemini returned invalid JSON."
    )


# ============================================================
# CALL GEMINI
# ============================================================

def call_gemini(model_name: str, user_prompt: str):

    print()
    print("=" * 60)
    print(f"Trying Gemini model: {model_name}")
    print("=" * 60)

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,

        response_mime_type="application/json",

        temperature=0.2,

        max_output_tokens=4096
    )

    try:

        response = client.models.generate_content(
            model=model_name,
            contents=user_prompt,
            config=config
        )

        result = parse_json_response(
            response.text
        )

        print()
        print("=" * 60)
        print(f"SUCCESS: Diagnosis generated using {model_name}")
        print("=" * 60)

        return result

    except Exception as error:

        print()
        print(f"ERROR using {model_name}")
        print(str(error))

        raise


# ============================================================
# MAIN DIAGNOSIS FUNCTION
# ============================================================

def diagnose_problem(problem: str, device: str = ""):

    # --------------------------------------------------------
    # Validate problem
    # --------------------------------------------------------

    if not problem or not problem.strip():

        raise ValueError(
            "Please describe your computer problem."
        )

    # --------------------------------------------------------
    # Create user prompt
    # --------------------------------------------------------

    user_prompt = f"""
Analyze this computer problem.

USER PROBLEM:
{problem}

DEVICE / MODEL:
{device if device.strip() else "Not provided"}

Give a practical diagnosis and repair guide.

If a replacement component might be required,
include it in parts_required and provide a useful search_query.

Return ONLY the required JSON.
"""

    # --------------------------------------------------------
    # CURRENT GEMINI MODELS
    # --------------------------------------------------------

    models_to_try = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite"
    ]

    last_error = None

    # --------------------------------------------------------
    # Try each model
    # --------------------------------------------------------

    for model_name in models_to_try:

        for attempt in range(3):

            try:

                return call_gemini(
                    model_name,
                    user_prompt
                )

            except Exception as error:

                last_error = error

                error_text = str(error).upper()

                # Temporary Gemini errors
                temporary_error = (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                    or "HIGH DEMAND" in error_text
                    or "TEMPORARILY" in error_text
                )

                if temporary_error and attempt < 2:

                    wait_time = attempt + 1

                    print()
                    print(
                        f"Temporary Gemini error."
                    )

                    print(
                        f"Retrying in {wait_time} seconds..."
                    )

                    time.sleep(wait_time)

                    continue

                # Try next model
                break

    # --------------------------------------------------------
    # All models failed
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("ALL GEMINI MODELS FAILED")
    print("=" * 60)

    print(last_error)

    raise RuntimeError(
        "Unable to generate diagnosis. "
        "Gemini API request failed. "
        f"Last error: {last_error}"
    )