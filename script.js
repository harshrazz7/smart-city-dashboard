// 1. CONFIGURATION
// Paste your token between the quotes. Keep the hf_ part!
const HF_TOKEN = "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";

let cityData = { weather: "No Data", money: "No Data", person: "No Data", fact: "No Data" };

// --- DATA FETCHING (Now with 'cache: no-store' to stop browser errors) ---

async function getWeather() {
    try {
        const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.86&current_weather=true', { cache: 'no-store' });
        const d = await r.json();
        const text = `${d.current_weather.temperature}°C`;
        document.getElementById('weather-val').innerText = text;
        cityData.weather = text;
    } catch (e) {
        document.getElementById('weather-val').innerText = "API Blocked";
    }
}

async function getMoney() {
    try {
        const r = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
        const d = await r.json();
        const text = `1 INR = ${(1 / d.rates.INR).toFixed(4)} USD`;
        document.getElementById('currency-val').innerText = text;
        cityData.money = text;
    } catch (e) { document.getElementById('currency-val').innerText = "Market Down"; }
}

async function getCitizen() {
    try {
        const r = await fetch('https://randomuser.me/api/', { cache: 'no-store' });
        const d = await r.json();
        const u = d.results[0];
        document.getElementById('citizen-val').innerHTML = `<img src="${u.picture.medium}"><br>${u.name.first}`;
        cityData.person = u.name.first;
    } catch (e) { document.getElementById('citizen-val').innerText = "Limit Reached"; }
}

async function getFact() {
    try {
        const r = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random', { cache: 'no-store' });
        const d = await r.json();
        document.getElementById('fact-val').innerText = d.text;
        cityData.fact = d.text;
    } catch (e) { document.getElementById('fact-val').innerText = "Offline"; }
}

// --- NEW AI LOGIC (Fixed for the 410 Error) ---

async function askAI() {
    const inputField = document.getElementById('user-input');
    const prompt = inputField.value;
    const chat = document.getElementById('chat-display');
    if (!prompt) return;

    chat.innerHTML += `<div class="user-txt"><b>You:</b> ${prompt}</div>`;
    inputField.value = "";
    chat.scrollTop = chat.scrollHeight;

    // Direct Context for the AI
    const fullPrompt = `You are CityAI. Data: Weather is ${cityData.weather}, Market is ${cityData.money}, Citizen is ${cityData.person}. Question: ${prompt} Answer:`;

    try {
        // NEW URL: Standard Inference (Works with Free Tokens)
        const response = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN.trim()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: fullPrompt,
                parameters: { max_new_tokens: 50, return_full_text: false }
            })
        });

        const result = await response.json();

        if (result.error) {
            // Check if model is loading (503 error)
            if (result.error.includes("loading")) {
                chat.innerHTML += `<div class="ai-txt" style="color:orange">AI is waking up... wait 10s and try again.</div>`;
            } else {
                chat.innerHTML += `<div class="ai-txt" style="color:red"><b>Error:</b> ${result.error}</div>`;
            }
        } else {
            // Standard success response
            let aiReply = Array.isArray(result) ? result[0].generated_text : result.generated_text;
            chat.innerHTML += `<div class="ai-txt"><b>AI:</b> ${aiReply.trim()}</div>`;
        }
    } catch (err) {
        chat.innerHTML += `<div class="ai-txt" style="color:red"><b>System:</b> Connection Blocked.</div>`;
    }
    chat.scrollTop = chat.scrollHeight;
}

// Start everything on Load
window.onload = () => { getWeather(); getMoney(); getCitizen(); getFact(); };