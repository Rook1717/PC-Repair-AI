// ==========================================
// CONFIGURATION
// ==========================================

const const API_URL = "https://pc-repair-ai.onrender.com";


// ==========================================
// GOOGLE ANALYTICS HELPER
// ==========================================

function trackEvent(eventName, eventData = {}) {

    if (typeof gtag === "function") {

        gtag(
            "event",
            eventName,
            eventData
        );

    }

    console.log(
        "GA4 Event:",
        eventName,
        eventData
    );

}


// ==========================================
// MAIN DIAGNOSIS FUNCTION
// ==========================================

async function diagnoseProblem() {

    const deviceInput =
        document.getElementById("device");

    const problemInput =
        document.getElementById("problem");

    const button =
        document.getElementById("diagnoseButton");

    const loadingSection =
        document.getElementById("loadingSection");

    const resultSection =
        document.getElementById("resultSection");

    const resultContainer =
        document.getElementById("resultContainer");


    const device =
        deviceInput.value.trim();

    const problem =
        problemInput.value.trim();


    // ------------------------------------------
    // Validation
    // ------------------------------------------

    if (!problem) {

        showPCAIToast(
            "Please describe your computer problem first."
        );

        problemInput.focus();

        trackEvent(
            "diagnosis_validation_error"
        );

        return;
    }


    // ------------------------------------------
    // Analytics - Diagnosis Started
    // ------------------------------------------

    trackEvent(
        "diagnosis_started",
        {
            device:
                device || "Not provided",

            problem_provided:
                true
        }
    );


    // ------------------------------------------
    // UI loading state
    // ------------------------------------------

    button.disabled = true;

    button.innerText =
        "Analyzing...";

    loadingSection.classList.remove(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    resultContainer.innerHTML = "";


    try {

        // --------------------------------------
        // API REQUEST
        // --------------------------------------

        const response = await fetch(
            `${API_URL}/diagnose`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    problem: problem,
                    device: device
                })
            }
        );


        const data =
            await response.json();


        // --------------------------------------
        // API ERROR
        // --------------------------------------

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Server returned an error."
            );

        }


        // --------------------------------------
        // DISPLAY RESULT
        // --------------------------------------

        displayResult(data);


        // --------------------------------------
        // ANALYTICS
        // --------------------------------------

        trackEvent(
            "diagnosis_completed",
            {
                device:
                    device || "Not provided",

                diagnosis_available:
                    true
            }
        );


    } catch (error) {

        console.error(error);


        resultContainer.innerHTML = `

            <div class="result-card">

                <h3>
                    ❌ Unable to generate diagnosis
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

                <p style="margin-top:10px;">

                    Please make sure the FastAPI backend
                    is running and your API keys are correct.

                </p>

            </div>

        `;


        resultSection.classList.remove(
            "hidden"
        );


        // --------------------------------------
        // ERROR ANALYTICS
        // --------------------------------------

        trackEvent(
            "diagnosis_error",
            {
                error_type:
                    error.message.substring(0, 100)
            }
        );


    } finally {

        loadingSection.classList.add(
            "hidden"
        );

        button.disabled = false;

        button.innerText =
            "🔍 Diagnose My Problem";

    }

}



// ==========================================
// DISPLAY RESULT
// ==========================================

function displayResult(data) {

    const resultSection =
        document.getElementById("resultSection");

    const resultContainer =
        document.getElementById("resultContainer");


    const diagnosis =
        data.diagnosis || {};

    const products =
        data.products || [];


    let html = "";


    // ======================================
    // HEADER
    // ======================================

    html += `

        <div class="result-header">

            <h2>
                ${escapeHTML(
                    diagnosis.title ||
                    "Computer Diagnosis"
                )}
            </h2>


            <p class="summary">

                ${escapeHTML(
                    diagnosis.summary ||
                    "No summary available."
                )}

            </p>


            <div class="info-row">

                <span class="info-badge">

                    Confidence:
                    ${escapeHTML(
                        diagnosis.confidence ||
                        "Unknown"
                    )}

                </span>


                <span class="info-badge">

                    Difficulty:
                    ${escapeHTML(
                        diagnosis.difficulty ||
                        "Unknown"
                    )}

                </span>

            </div>

        </div>

    `;


    // ======================================
    // POSSIBLE CAUSES
    // ======================================

    html += `

        <div class="result-card">

            <h3>
                🔎 Possible Causes
            </h3>

            ${createList(
                diagnosis.possible_causes
            )}

        </div>

    `;


    // ======================================
    // DIAGNOSIS STEPS
    // ======================================

    html += `

        <div class="result-card">

            <h3>
                🧪 Diagnosis / Checking Steps
            </h3>

            ${createNumberedList(
                diagnosis.diagnosis_steps
            )}

        </div>

    `;


    // ======================================
    // REPAIR STEPS
    // ======================================

    html += `

        <div class="result-card">

            <h3>
                🔧 Step-by-Step Repair
            </h3>

            ${createRepairSteps(
                diagnosis.repair_steps
            )}

        </div>

    `;


    trackEvent(
        "repair_steps_viewed"
    );


    // ======================================
    // TOOLS
    // ======================================

    html += `

        <div class="result-card">

            <h3>
                🧰 Tools Required
            </h3>

            ${createList(
                diagnosis.tools_required
            )}

        </div>

    `;


    // ======================================
    // PRODUCTS
    // ======================================

    if (products.length > 0) {

        html += `

            <div class="result-card">

                <h3>
                    🛒 Required Components & Products
                </h3>

        `;


        products.forEach(
            component => {

                html += `

                    <div class="component-title">

                        ${escapeHTML(
                            component.component ||
                            "Required Component"
                        )}

                    </div>

                `;


                if (
                    component.products &&
                    component.products.length > 0
                ) {

                    html += `
                        <div class="product-grid">
                    `;


                    component.products.forEach(
                        product => {

                            html += createProductCard(
                                product
                            );

                        }
                    );


                    html += `
                        </div>
                    `;

                } else {

                    html += `

                        <div class="no-products">

                            No current shopping result
                            was found for this component.

                        </div>

                    `;

                }

            }
        );


        html += `
            </div>
        `;

    }


    // ======================================
    // SAFETY
    // ======================================

    html += `

        <div class="safety-box">

            <h3>
                ⚠️ Safety Warnings
            </h3>

            ${createList(
                diagnosis.safety
            )}

        </div>

    `;


    // ======================================
    // PROFESSIONAL
    // ======================================

    html += `

        <div class="professional-box">

            <h3>
                👨‍🔧 When To Visit A Professional
            </h3>

            ${createList(
                diagnosis.when_to_visit_professional
            )}

        </div>

    `;


    // ======================================
    // RESULT FEEDBACK
    // ======================================

    html += `

        <div class="pcai-result-feedback">

            <div class="pcai-result-feedback-icon">
                ⭐
            </div>

            <h3>
                Was this diagnosis helpful?
            </h3>

            <p>
                Your feedback helps improve this assistant.
            </p>

            <div class="pcai-result-feedback-buttons">

                <button
                    onclick="quickDiagnosisFeedback(1)"
                >
                    😡
                </button>

                <button
                    onclick="quickDiagnosisFeedback(2)"
                >
                    😕
                </button>

                <button
                    onclick="quickDiagnosisFeedback(3)"
                >
                    😐
                </button>

                <button
                    onclick="quickDiagnosisFeedback(4)"
                >
                    🙂
                </button>

                <button
                    onclick="quickDiagnosisFeedback(5)"
                >
                    🤩
                </button>

            </div>

        </div>

    `;


    // ======================================
    // ACTION AREA
    // ======================================

    html += `

        <div class="pcai-result-actions">

            <button
                onclick="openPCAIFeedback()"
            >
                ⭐ Give Detailed Feedback
            </button>

            <button
                onclick="openPCAIReport()"
            >
                🐛 Report a Problem
            </button>

        </div>

    `;


    // ======================================
    // INSERT HTML
    // ======================================

    resultContainer.innerHTML =
        html;


    resultSection.classList.remove(
        "hidden"
    );


    // ======================================
    // ANALYTICS
    // ======================================

    trackEvent(
        "solution_viewed",
        {
            diagnosis_title:
                diagnosis.title ||
                "Computer Diagnosis",

            products_available:
                products.length > 0,

            product_count:
                products.length
        }
    );


    // ======================================
    // SCROLL
    // ======================================

    resultSection.scrollIntoView({
        behavior: "smooth"
    });

}



// ==========================================
// QUICK DIAGNOSIS FEEDBACK
// ==========================================

function quickDiagnosisFeedback(rating) {

    trackEvent(
        "diagnosis_feedback",
        {
            rating: rating
        }
    );


    const messages = {

        1:
            "Sorry the diagnosis wasn't useful.",

        2:
            "Thanks. We'll work on improving it.",

        3:
            "Thanks for your feedback.",

        4:
            "Great! We're glad it helped.",

        5:
            "Awesome! We're glad the diagnosis helped."

    };


    showPCAIToast(
        messages[rating] ||
        "Thank you for your feedback."
    );

}



// ==========================================
// PRODUCT CARD
// ==========================================

function createProductCard(product) {

    const title =
        product.title ||
        "Product";

    const price =
        product.price ||
        "Price unavailable";

    const image =
        product.image ||
        "";

    const link =
        product.link ||
        "#";

    const source =
        product.source ||
        "Online Store";


    let ratingHTML = "";


    if (product.rating) {

        ratingHTML = `

            <div class="product-rating">

                ⭐ ${escapeHTML(
                    String(product.rating)
                )}

                ${
                    product.reviews
                    ? `(${escapeHTML(
                        String(product.reviews)
                    )} reviews)`
                    : ""
                }

            </div>

        `;

    }


    const safeLink =
        escapeAttribute(link);


    const safeImage =
        escapeAttribute(image);


    return `

        <div
            class="product-card"
            onclick="trackProductView('${escapeAttribute(title)}')"
        >

            ${
                image
                ? `

                    <img
                        src="${safeImage}"
                        alt="${escapeAttribute(title)}"
                        loading="lazy"
                    >

                  `
                : `

                    <div
                        style="
                            height:210px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            background:#f8fafc;
                            font-size:50px;
                        "
                    >
                        🧩
                    </div>

                  `
            }


            <div class="product-info">

                <h4>
                    ${escapeHTML(title)}
                </h4>


                <div class="product-source">

                    ${escapeHTML(source)}

                </div>


                <div class="product-price">

                    ${escapeHTML(price)}

                </div>


                ${ratingHTML}


                ${
                    link !== "#"
                    ? `

                        <a
                            class="buy-button"
                            href="${safeLink}"
                            target="_blank"
                            rel="noopener noreferrer"
                            onclick="trackProductClick(
                                '${escapeAttribute(title)}'
                            )"
                        >
                            View Product
                        </a>

                      `
                    : `

                        <div class="no-products">

                            Product link unavailable

                        </div>

                      `
                }

            </div>

        </div>

    `;

}



// ==========================================
// PRODUCT VIEW ANALYTICS
// ==========================================

function trackProductView(productName) {

    trackEvent(
        "product_view",
        {
            product_name:
                productName
        }
    );

}



// ==========================================
// PRODUCT CLICK ANALYTICS
// ==========================================

function trackProductClick(productName) {

    trackEvent(
        "product_link_clicked",
        {
            product_name:
                productName
        }
    );

}



// ==========================================
// CREATE LIST
// ==========================================

function createList(items) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return `
            <p>
                No information available.
            </p>
        `;

    }


    return `

        <ul>

            ${items.map(
                item => `

                    <li>

                        ${escapeHTML(
                            String(item)
                        )}

                    </li>

                `
            ).join("")}

        </ul>

    `;

}



// ==========================================
// NUMBERED LIST
// ==========================================

function createNumberedList(items) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return `
            <p>
                No diagnosis steps available.
            </p>
        `;

    }


    return `

        <ol>

            ${items.map(
                item => `

                    <li>

                        ${escapeHTML(
                            String(item)
                        )}

                    </li>

                `
            ).join("")}

        </ol>

    `;

}



// ==========================================
// REPAIR STEPS
// ==========================================

function createRepairSteps(steps) {

    if (
        !Array.isArray(steps) ||
        steps.length === 0
    ) {

        return `
            <p>
                No repair steps available.
            </p>
        `;

    }


    return steps.map(
        (item, index) => {

            return `

                <div class="repair-step">

                    <div class="step-number">

                        ${
                            item.step ||
                            index + 1
                        }

                    </div>


                    <div class="step-content">

                        <h4>

                            ${escapeHTML(
                                item.title ||
                                `Step ${index + 1}`
                            )}

                        </h4>


                        <p>

                            ${escapeHTML(
                                item.details ||
                                ""
                            )}

                        </p>

                    </div>

                </div>

            `;

        }
    ).join("");

}



// ==========================================
// HTML SECURITY
// ==========================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



function escapeAttribute(value) {

    return escapeHTML(value);

}



// ======================================================
// ======================================================
//                  ADDON FEATURES
// ======================================================
// ======================================================



// ==========================================
// QUICK MENU
// ==========================================

function togglePCAIQuickMenu() {

    const panel =
        document.getElementById(
            "pcaiQuickPanel"
        );


    if (!panel) return;


    panel.classList.toggle(
        "show"
    );


    trackEvent(
        "quick_menu_toggle",
        {
            state:
                panel.classList.contains("show")
                    ? "open"
                    : "close"
        }
    );

}



function closeQuickMenu() {

    const panel =
        document.getElementById(
            "pcaiQuickPanel"
        );


    if (panel) {

        panel.classList.remove(
            "show"
        );

    }

}



// ==========================================
// MODAL FUNCTIONS
// ==========================================

function openPCAIModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) return;


    modal.classList.add(
        "show"
    );

}



function closePCAIModal(id) {

    const modal =
        document.getElementById(id);


    if (!modal) return;


    modal.classList.remove(
        "show"
    );

}



// ==========================================
// PC HEALTH CHECK
// ==========================================

function openPCAIHealth() {

    closeQuickMenu();


    openPCAIModal(
        "pcaiHealthModal"
    );


    trackEvent(
        "pc_health_check_open"
    );

}



function runPCAIHealthCheck() {

    const device =
        document.getElementById(
            "pcaiDevice"
        ).value;


    const ram =
        Number(
            document.getElementById(
                "pcaiRam"
            ).value
        );


    const storage =
        document.getElementById(
            "pcaiStorage"
        ).value;


    const age =
        document.getElementById(
            "pcaiAge"
        ).value;


    const problem =
        document.getElementById(
            "pcaiHealthProblem"
        ).value;


    let score = 100;


    // RAM

    if (ram <= 4) {

        score -= 25;

    }

    else if (ram === 8) {

        score -= 10;

    }


    // STORAGE

    if (storage === "hdd") {

        score -= 20;

    }

    else if (storage === "ssd") {

        score -= 5;

    }


    // AGE

    if (age === "3-5") {

        score -= 5;

    }

    else if (age === "5plus") {

        score -= 15;

    }


    // PROBLEM

    if (problem === "slow") {

        score -= 8;

    }

    else if (problem === "overheating") {

        score -= 10;

    }

    else if (problem === "crashing") {

        score -= 15;

    }

    else if (problem === "battery") {

        score -= 8;

    }

    else if (problem === "internet") {

        score -= 5;

    }


    score =
        Math.max(
            20,
            Math.min(
                100,
                score
            )
        );


    let status;

    let advice;


    if (score >= 85) {

        status =
            "Excellent";


        advice =
            "Your configuration looks healthy. Keep Windows, drivers and security software updated.";

    }

    else if (score >= 70) {

        status =
            "Good";


        advice =
            "Your PC is in generally good condition. A few improvements could make it better.";

    }

    else if (score >= 50) {

        status =
            "Needs Attention";


        advice =
            "Consider checking storage, memory, cooling and unnecessary startup applications.";

    }

    else {

        status =
            "Needs Improvement";


        advice =
            "Your PC may benefit from maintenance or hardware upgrades. Run the AI diagnosis for a deeper analysis.";

    }


    const result =
        document.getElementById(
            "pcaiHealthResult"
        );


    if (!result) return;


    result.innerHTML = `

        <div class="pcai-health-score">

            <div class="pcai-health-number">
                ${score}
            </div>

            <div class="pcai-health-status">
                ${status}
            </div>

        </div>


        <div class="pcai-health-advice">

            <strong>
                Recommendation
            </strong>

            <br><br>

            ${escapeHTML(advice)}

        </div>

    `;


    trackEvent(
        "pc_health_check_complete",
        {

            device_type:
                device,

            ram_gb:
                ram,

            storage_type:
                storage,

            pc_age:
                age,

            reported_problem:
                problem,

            health_score:
                score

        }
    );

}



// ==========================================
// QUICK TOOLS
// ==========================================

function openPCAITools() {

    closeQuickMenu();


    openPCAIModal(
        "pcaiToolsModal"
    );


    trackEvent(
        "pc_tools_open"
    );

}



function pcaiTool(toolName) {

    trackEvent(
        "tool_used",
        {
            tool_name:
                toolName
        }
    );


    let message = "";


    switch (toolName) {

        case "RAM Calculator":

            message =
                "For normal Windows use, 8 GB is a basic level and 16 GB is a more comfortable level for multitasking.";

            break;


        case "Storage Guide":

            message =
                "SSD and NVMe storage are generally much faster for Windows booting and application loading than HDD.";

            break;


        case "Temperature Guide":

            message =
                "High temperatures can cause performance throttling. Check your manufacturer's specifications.";

            break;


        case "Windows Tips":

            message =
                "Review startup applications, keep Windows updated and remove software you no longer use.";

            break;


        case "Internet Troubleshooter":

            message =
                "Restart your router, test another device and compare Wi-Fi with Ethernet where possible.";

            break;


        case "Battery Guide":

            message =
                "Check battery health, charging behavior and power settings. Battery capacity naturally decreases over time.";

            break;


        default:

            message =
                "Tool information is currently unavailable.";

    }


    showPCAIToast(
        message
    );

}



// ==========================================
// FEEDBACK
// ==========================================

let pcaiSelectedRating = 0;



function openPCAIFeedback() {

    closeQuickMenu();


    openPCAIModal(
        "pcaiFeedbackModal"
    );


    trackEvent(
        "feedback_open"
    );

}



function selectPCAIRating(rating) {

    pcaiSelectedRating =
        rating;


    const buttons =
        document.querySelectorAll(
            ".pcai-rating button"
        );


    buttons.forEach(
        (button, index) => {

            button.classList.toggle(
                "selected",
                index + 1 === rating
            );

        }
    );


    const labels = {

        1:
            "Very poor",

        2:
            "Needs improvement",

        3:
            "Okay",

        4:
            "Good",

        5:
            "Excellent"

    };


    const ratingText =
        document.getElementById(
            "pcaiRatingText"
        );


    if (ratingText) {

        ratingText.textContent =
            labels[rating];

    }


    trackEvent(
        "feedback_rating_selected",
        {
            rating:
                rating
        }
    );

}



function submitPCAIFeedback() {

    if (
        pcaiSelectedRating === 0
    ) {

        showPCAIToast(
            "Please select a rating first."
        );

        return;

    }


    const feedbackElement =
        document.getElementById(
            "pcaiFeedbackText"
        );


    const feedback =
        feedbackElement
            ? feedbackElement.value.trim()
            : "";


    trackEvent(
        "feedback_submit",
        {

            rating:
                pcaiSelectedRating,

            feedback_provided:
                feedback.length > 0

        }
    );


    if (feedbackElement) {

        feedbackElement.value = "";

    }


    pcaiSelectedRating =
        0;


    document.querySelectorAll(
        ".pcai-rating button"
    ).forEach(
        button => {

            button.classList.remove(
                "selected"
            );

        }
    );


    closePCAIModal(
        "pcaiFeedbackModal"
    );


    showPCAIToast(
        "Thank you! Your feedback has been recorded."
    );

}



// ==========================================
// REPORT PROBLEM
// ==========================================

function openPCAIReport() {

    closeQuickMenu();


    openPCAIModal(
        "pcaiReportModal"
    );


    trackEvent(
        "report_problem_open"
    );

}



function submitPCAIReport() {

    const categoryElement =
        document.getElementById(
            "pcaiReportCategory"
        );


    const textElement =
        document.getElementById(
            "pcaiReportText"
        );


    const category =
        categoryElement
            ? categoryElement.value
            : "other";


    const description =
        textElement
            ? textElement.value.trim()
            : "";


    if (!description) {

        showPCAIToast(
            "Please describe the problem."
        );

        return;

    }


    trackEvent(
        "report_problem_submit",
        {

            category:
                category,

            description_provided:
                true

        }
    );


    if (textElement) {

        textElement.value = "";

    }


    closePCAIModal(
        "pcaiReportModal"
    );


    showPCAIToast(
        "Thanks. Your report has been submitted."
    );

}



// ==========================================
// DARK / LIGHT MODE
// ==========================================

function togglePCAITheme() {

    document.body.classList.toggle(
        "pcai-dark"
    );


    const isDark =
        document.body.classList.contains(
            "pcai-dark"
        );


    localStorage.setItem(
        "pcai_theme",
        isDark
            ? "dark"
            : "light"
    );


    const button =
        document.getElementById(
            "pcaiThemeButton"
        );


    if (button) {

        button.textContent =
            isDark
                ? "☀️"
                : "🌙";

    }


    trackEvent(
        "theme_change",
        {
            theme:
                isDark
                    ? "dark"
                    : "light"
        }
    );

}



function loadPCAITheme() {

    const savedTheme =
        localStorage.getItem(
            "pcai_theme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "pcai-dark"
        );


        const button =
            document.getElementById(
                "pcaiThemeButton"
            );


        if (button) {

            button.textContent =
                "☀️";

        }

    }

}



// ==========================================
// TOAST NOTIFICATION
// ==========================================

let pcaiToastTimer;


function showPCAIToast(message) {

    const toast =
        document.getElementById(
            "pcaiToast"
        );


    if (!toast) {

        alert(message);

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        pcaiToastTimer
    );


    pcaiToastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}



// ==========================================
// MODAL OUTSIDE CLICK
// ==========================================

document.addEventListener(
    "click",
    function(event) {

        const modals =
            document.querySelectorAll(
                ".pcai-modal"
            );


        modals.forEach(
            modal => {

                if (
                    event.target === modal
                ) {

                    modal.classList.remove(
                        "show"
                    );

                }

            }
        );

    }
);



// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            document
                .querySelectorAll(
                    ".pcai-modal.show"
                )
                .forEach(
                    modal => {

                        modal.classList.remove(
                            "show"
                        );

                    }
                );


            closeQuickMenu();

        }

    }
);



// ==========================================
// INITIALIZE
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadPCAITheme();


        console.log(
            "PC Care AI Addons Loaded Successfully."
        );

    }
);
