import os
import requests
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")


def search_products(
    search_query: str,
    location: str = "Mumbai, Maharashtra, India"
):

    if not SERPAPI_KEY:
        print("SERPAPI_KEY is missing.")
        return []

    if not search_query or not search_query.strip():
        print("Shopping search query is empty.")
        return []

    # Clean Gemini's query
    query = search_query.strip()

    # If Gemini gives multiple alternatives,
    # search using the first useful component.
    if " or " in query.lower():
        query = query.split(" or ")[0].strip()

    params = {
        "engine": "google_shopping",
        "q": query,
        "location": location,
        "hl": "en",
        "gl": "in",
        "api_key": SERPAPI_KEY
    }

    try:

        print()
        print("=" * 60)
        print("SERPAPI SHOPPING SEARCH")
        print("=" * 60)
        print("Original query:", search_query)
        print("Actual query:", query)

        response = requests.get(
            "https://serpapi.com/search.json",
            params=params,
            timeout=45
        )

        print(
            "SerpApi status:",
            response.status_code
        )

        response.raise_for_status()

        data = response.json()

        if "error" in data:

            print(
                "SerpApi error:",
                data["error"]
            )

            return []

        shopping_results = data.get(
            "shopping_results",
            []
        )

        print(
            "Results found:",
            len(shopping_results)
        )

        products = []

        for item in shopping_results[:5]:

            products.append({
                "title": item.get("title"),
                "price": item.get("price"),
                "image": item.get("thumbnail"),

                "link": (
                    item.get("product_link")
                    or item.get("link")
                ),

                "source": item.get("source"),
                "rating": item.get("rating"),
                "reviews": item.get("reviews")
            })

        return products

    except requests.exceptions.Timeout:

        print("SerpApi request timed out.")
        return []

    except requests.exceptions.ConnectionError as error:

        print(
            "SerpApi connection error:",
            error
        )

        return []

    except requests.exceptions.RequestException as error:

        print(
            "SerpApi request error:",
            error
        )

        return []

    except Exception as error:

        print(
            "Unexpected shopping error:",
            error
        )

        return []