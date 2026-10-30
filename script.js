
// WattWise - Bill Analysis + Local Gemma 3 AI

function getNumber(id) {
    return Number(document.getElementById(id).value);
}

function money(amount) {
    return "₹" + amount.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
    });
}

// Compare electricity bills
function compareBills() {
    var previousInput = document.getElementById("previousBillAmount").value;
    var currentInput = document.getElementById("currentBillAmount").value;
    var previous = Number(previousInput);
    var current = Number(currentInput);
    var result = document.getElementById("billResult");

    if (
        previousInput === "" ||
        currentInput === "" ||
        previous < 0 ||
        current < 0
    ) {
        result.textContent = "Please enter both bill amounts. They cannot be negative.";
        return;
    }

    var difference = current - previous;
    var percent = previous === 0 ? null : difference / previous * 100;

    document.getElementById("previousSummary").textContent = money(previous);
    document.getElementById("currentSummary").textContent = money(current);
    document.getElementById("differenceSummary").textContent =
        (difference > 0 ? "+" : difference < 0 ? "-" : "") +
        money(Math.abs(difference));

    if (difference > 0) {
        result.textContent = "Your bill increased by " + money(difference) +
            (percent === null ? "." : " (" + percent.toFixed(1) + "%).") +
            " Check your usage and tariff.";
    } else if (difference < 0) {
        result.textContent = "Your bill decreased by " + money(Math.abs(difference)) +
            (percent === null ? "." : " (" + Math.abs(percent).toFixed(1) + "%).") +
            " Your current bill is lower.";
    } else {
        result.textContent = "Both bills have the same amount.";
    }
}

// Estimate appliance electricity usage
function calculateUsage() {
    var name = document.getElementById("applianceName").value.trim();
    var wattsInput = document.getElementById("applianceWatts").value;
    var hoursInput = document.getElementById("applianceHours").value;
    var quantityInput = document.getElementById("applianceQuantity").value;

    var watts = Number(wattsInput);
    var hours = Number(hoursInput);
    var quantity = Number(quantityInput);
    var result = document.getElementById("usageResult");

    if (
        !name || wattsInput === "" || hoursInput === "" ||
        quantityInput === "" || !Number.isFinite(watts) ||
        !Number.isFinite(hours) || !Number.isFinite(quantity) ||
        watts < 0 || hours < 0 || hours > 24 ||
        quantity < 1 || !Number.isInteger(quantity)
    ) {
        result.textContent =
            "Enter the appliance name, valid watts, hours from 0 to 24, " +
            "and a whole-number quantity of at least 1.";
        return;
    }

    var daily = watts * hours * quantity / 1000;
    var monthly = daily * 30;
    var rate = 8; // Example rate in ₹ per kWh

    result.textContent = name + " may use " + daily.toFixed(2) +
        " kWh daily and " + monthly.toFixed(2) +
        " kWh in 30 days. At ₹" + rate +
        " per unit, estimated monthly cost: " + money(monthly * rate) + ".";
}

// Ask your installed Gemma model through Ollama
async function getSuggestion() {
    var promptBox = document.getElementById("aiPrompt");
    var response = document.getElementById("aiResponse");
    var button = document.getElementById("aiSubmitButton");
    var question = promptBox.value.trim();

    if (!question) {
        response.textContent = "Please type an electricity-related question first.";
        promptBox.focus();
        return;
    }

    var context = [];
    var previousBill = document.getElementById("previousBillAmount").value;
    var currentBill = document.getElementById("currentBillAmount").value;
    var applianceName = document.getElementById("applianceName").value.trim();
    var applianceWatts = document.getElementById("applianceWatts").value;
    var applianceHours = document.getElementById("applianceHours").value;
    var applianceQuantity = document.getElementById("applianceQuantity").value;

    if (previousBill !== "") context.push("Previous bill: ₹" + previousBill);
    if (currentBill !== "") context.push("Current bill: ₹" + currentBill);
    if (applianceName) context.push("Appliance: " + applianceName);
    if (applianceWatts !== "") context.push("Power: " + applianceWatts + " watts");
    if (applianceHours !== "") context.push("Daily usage: " + applianceHours + " hours");
    if (applianceQuantity !== "") context.push("Quantity: " + applianceQuantity);

    // IMPORTANT: This must match `ollama list`
    var modelName = "gemma3:latest";

    var fullPrompt = [
        "You are WattWise, a helpful household electricity bill and energy-saving assistant.",
        "Answer in simple, beginner-friendly language.",
        "Use Indian rupees (₹) and kWh when relevant.",
        "Give practical and safe electricity-saving suggestions.",
        "Do not invent meter readings, tariffs, or electricity provider rules.",
        "Clearly label estimates and explain what information is missing.",
        "For electrical hazards, recommend a qualified electrician.",
        context.length
            ? "Information from the website:\n" + context.join("\n")
            : "No bill or appliance details were provided.",
        "User question:\n" + question
    ].join("\n\n");

    button.disabled = true;
    button.textContent = "Gemma is thinking...";
    response.textContent = "Connecting to Gemma 3. The first response may take a little time.";

    try {
        var result = await fetch("http://127.0.0.1:11434/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ],
                stream: false
            })
        });

        var data = await result.json();

        if (!result.ok) {
            throw new Error(data.error || "Ollama returned an error.");
        }

        response.textContent =
            data.message && data.message.content
                ? data.message.content
                : "No answer was returned. Please try again.";

    } catch (error) {
        response.textContent =
            "Could not connect to Gemma 3.\n\n" +
            "Check that Ollama is running and that gemma3:latest is installed.\n" +
            "If the error says Failed to fetch, check Ollama's browser CORS permissions.\n\n" +
            "Technical details: " + error.message;
    } finally {
        button.disabled = false;
        button.textContent = "Get Suggestion";
    }
}

// Apply appearance settings
function applySettings() {
    var theme = document.getElementById("theme").value;
    var color = document.getElementById("colorPalette").value;

    document.body.classList.toggle("dark", theme === "dark");
    document.documentElement.style.setProperty("--main-color", color);
    document.documentElement.style.setProperty("--main-dark", color);

    var message = document.getElementById("settingsMessage");
    if (message) {
        message.textContent = "Settings applied for this page.";
    }
}

// Connect website buttons
document.getElementById("compareButton").addEventListener("click", compareBills);
document.getElementById("calculateButton").addEventListener("click", calculateUsage);
document.getElementById("aiSubmitButton").addEventListener("click", getSuggestion);
document.getElementById("saveSettingsButton").addEventListener("click", applySettings);

// Ctrl+Enter submits the AI question
document.getElementById("aiPrompt").addEventListener("keydown", function (event) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        getSuggestion();
    }
});
