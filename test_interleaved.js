// Mock DOM
class MockElement {
    constructor(id, text) {
        this.id = id;
        this.textContent = text;
        this.dataset = {};
        this.classList = {
            contains: (c) => c === 'monetary-value'
        };
    }
}

// Elements
const kpi = new MockElement('kpi', 'R$ 100,00'); // Dashboard KPI
const resumo = new MockElement('resumo', 'R$ 100,00'); // Resumo KPI

// Document Mock
const elements = [kpi, resumo];
const document = {
    body: {
        classList: {
            _classes: new Set(['values-hidden']), // Start hidden
            contains: (c) => document.body.classList._classes.has(c),
            remove: (c) => document.body.classList._classes.delete(c),
            add: (c) => document.body.classList._classes.add(c)
        }
    },
    querySelectorAll: () => elements
};

// The Fix Logic
const toggleValuesVisibility = (caller) => {
    console.log(`\n[Toggle called by ${caller}]`);
    const isHidden = document.body.classList.contains('values-hidden');
    elements.forEach(el => {
        if (isHidden) {
            const hasNewContent = el.textContent && el.textContent.trim() !== '';
            const originalValue = hasNewContent ? el.textContent : (el.dataset.originalValue || el.textContent);

            console.log(`  Processing ${el.id}: text='${el.textContent}', dataset='${el.dataset.originalValue}'. NewContent=${hasNewContent}. Resulting Dataset='${originalValue}'`);

            el.dataset.originalValue = originalValue;
            el.textContent = '';
        } else {
            // ... (unhide logic)
        }
    });
};

// Simulation
console.log("--- Initial State (Hidden, Month A) ---");
// Assume they were already processed once
kpi.dataset.originalValue = 'R$ 100,00';
kpi.textContent = '';
resumo.dataset.originalValue = 'R$ 100,00';
resumo.textContent = '';

console.log(`KPI: text='${kpi.textContent}', data='${kpi.dataset.originalValue}'`);
console.log(`Resumo: text='${resumo.textContent}', data='${resumo.dataset.originalValue}'`);

console.log("\n--- Switching to Month B ---");

// 1. Render Dashboard (Updates KPI, DOES NOT Toggle)
console.log("1. Render Dashboard (Updates KPI to 200)");
kpi.textContent = "R$ 200,00";
// Note: kpi dataset is still 100. kpi text is now 200.

// 2. Render Producao (Calls Toggle)
console.log("2. Render Producao (Calls Toggle)");
toggleValuesVisibility("RenderProducao");

// Check state
// KPI should be fixed (dataset 200, text empty)
// Resumo should be untouched (dataset 100, text empty) as it wasn't updated yet

// 3. Render Resumo (Updates Resumo to 200, Calls Toggle)
console.log("3. Render Resumo (Updates Resumo to 200)");
resumo.textContent = "R$ 200,00";
console.log("3b. Render Resumo (Calls Toggle)");
toggleValuesVisibility("RenderResumo");

console.log("\n--- Final State (Still Hidden) ---");
console.log(`KPI: text='${kpi.textContent}', data='${kpi.dataset.originalValue}'`);
console.log(`Resumo: text='${resumo.textContent}', data='${resumo.dataset.originalValue}'`);

// Assertions
if (kpi.dataset.originalValue !== 'R$ 200,00') console.error("FAIL: KPI has wrong value!");
if (resumo.dataset.originalValue !== 'R$ 200,00') console.error("FAIL: Resumo has wrong value!");

console.log("\n--- Unhiding ---");
document.body.classList.remove('values-hidden');
elements.forEach(el => {
     if (el.dataset.originalValue) {
        el.textContent = el.dataset.originalValue;
    }
});
console.log(`KPI: text='${kpi.textContent}'`);
console.log(`Resumo: text='${resumo.textContent}'`);
