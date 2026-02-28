// ── API CONFIGURATION ─────────────────────────────────────────────
const DEFAULT_API_URL = "https://xxx.trycloudflare.com/process-circuit";
const apiUrlInput = document.getElementById('apiUrlInput');
const apiApplyBtn = document.getElementById('apiApplyBtn');

// Load saved URL from local storage, or fall back to default
let currentApiUrl = localStorage.getItem('circuitApiUrl') || DEFAULT_API_URL;

// Pre-fill the input box with the active base URL (hiding the endpoint for a cleaner look)
if (apiUrlInput) {
    apiUrlInput.value = currentApiUrl.replace(/\/process-circuit$/, '');
}

// Handle the Apply button click
if (apiApplyBtn && apiUrlInput) {
    apiApplyBtn.addEventListener('click', () => {
        let val = apiUrlInput.value.trim();
        
        if (!val) {
            // If empty, reset to default
            currentApiUrl = DEFAULT_API_URL;
            localStorage.removeItem('circuitApiUrl');
        } else {
            // Auto-append endpoint if missing
            if (!val.endsWith('/process-circuit')) {
                val = val.replace(/\/$/, '') + '/process-circuit';
            }
            currentApiUrl = val;
            localStorage.setItem('circuitApiUrl', currentApiUrl); // Save for next time
        }
        
        // Give satisfying visual feedback
        const originalText = apiApplyBtn.textContent;
        apiApplyBtn.textContent = 'Saved!';
        apiApplyBtn.classList.add('success');
        setTimeout(() => {
            apiApplyBtn.textContent = originalText;
            apiApplyBtn.classList.remove('success');
        }, 1500);
    });
}

// ── THEME ─────────────────────────────────────────────────────────
const themeToggle  = document.getElementById('themeToggle');
const toggleThumb  = document.getElementById('toggleThumb');
const toggleLabel  = document.getElementById('toggle-label');
const html         = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeToggle.addEventListener('change', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('theme', next);
});

function applyTheme(t) {
    html.dataset.theme = t;
    if (t === 'light') {
        themeToggle.checked = true;
        if(toggleThumb) toggleThumb.textContent = ''; 
        if(toggleLabel) toggleLabel.textContent = 'Light';
    } else {
        themeToggle.checked = false;
        if(toggleThumb) toggleThumb.textContent = ''; 
        if(toggleLabel) toggleLabel.textContent = 'Dark';
    }
}

// ── SECTION COLLAPSE (animated) ───────────────────────────────────
function toggleCard(header) {
    const body = header.nextElementSibling;
    const collapsing = !header.classList.contains('collapsed');

    header.classList.toggle('collapsed', collapsing);
    header.setAttribute('aria-expanded', String(!collapsing));

    if (collapsing) {
        body.style.overflow  = 'hidden';
        body.style.maxHeight = body.scrollHeight + 'px';
        requestAnimationFrame(() => {
            body.style.transition = 'max-height 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease';
            body.style.maxHeight  = '0';
            body.style.opacity    = '0';
        });
        body.addEventListener('transitionend', () => {
            if (header.classList.contains('collapsed')) {
                body.classList.add('hidden');
                body.style.cssText = '';
            }
        }, { once: true });
    } else {
        body.classList.remove('hidden');
        body.style.overflow  = 'hidden';
        body.style.maxHeight = '0';
        body.style.opacity   = '0';
        requestAnimationFrame(() => {
            body.style.transition = 'max-height 0.38s cubic-bezier(0.16,1,0.3,1), opacity 0.32s ease';
            body.style.maxHeight  = body.scrollHeight + 'px';
            body.style.opacity    = '1';
        });
        body.addEventListener('transitionend', () => {
            if (!header.classList.contains('collapsed')) {
                body.style.cssText = '';
            }
        }, { once: true });
    }
}

document.querySelectorAll('.rc-header').forEach(h => {
    h.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCard(h); }
    });
});

// ── EQUATION MODE ─────────────────────────────────────────────────
let eqMode = 'text';         
let rawEquations = {};       

function setEqMode(mode) {
    eqMode = mode;

    document.getElementById('btn-text').classList.toggle('active', mode === 'text');
    document.getElementById('btn-symbol').classList.toggle('active', mode === 'symbol');

    const legend = document.getElementById('sym-legend');
    legend.classList.toggle('visible', mode === 'symbol');

    renderEquations();
}

/**
 * Convert a text boolean equation string into HTML with symbols.
 * Handles nested symbols correctly using recursive parsing.
 */
function toSymbolHtml(eq) {
    if (!eq) return '';

    const tokenRegex = /\b(XNOR|xnor|NOR|nor|NAND|nand|XOR|xor|NOT|not|AND|and|OR|or)\b|([A-Za-z_][A-Za-z0-9_]*)|(\(|\))|([=])|(\d+)|([+\-·⊕⊙∧∨¬])/gi;
    const tokens = [];
    let m;
    while ((m = tokenRegex.exec(eq)) !== null) {
        if(m[0].trim() !== '') tokens.push(m[0]);
    }

    function parseExpression(startIdx, endIdx) {
        let out = [];
        let i = startIdx;
        
        while (i < endIdx) {
            const tok = tokens[i];
            const upper = tok.toUpperCase();

            if (upper === 'AND' || tok === '∧') {
                out.push('<span class="op-sym"> · </span>');
            } else if (upper === 'OR' || tok === '∨') {
                out.push('<span class="op-sym"> + </span>');
            } else if (upper === 'XOR' || tok === '⊕') {
                out.push('<span class="op-sym"> ⊕ </span>');
            } else if (upper === 'XNOR' || tok === '⊙') {
                out.push('<span class="op-sym"> ⊙ </span>');
            } else if (upper === 'NAND') {
                out.push('<span class="op-sym"> NAND </span>'); 
            } else if (upper === 'NOR') {
                out.push('<span class="op-sym"> NOR </span>');  
            } else if (upper === 'NOT' || tok === '¬') {
                let j = i + 1;
                if (j < endIdx) {
                    if (tokens[j] === '(') {
                        let depth = 1;
                        let k = j + 1;
                        while (k < endIdx && depth > 0) {
                            if (tokens[k] === '(') depth++;
                            if (tokens[k] === ')') depth--;
                            k++;
                        }
                        let inner = parseExpression(j + 1, k - 1);
                        out.push(`<span class="overbar">(${inner})</span>`);
                        i = k - 1; 
                    } else {
                        out.push(`<span class="overbar">${escHtml(tokens[j])}</span>`);
                        i = j;
                    }
                }
            } else if (tok === '(' || tok === ')') {
                out.push(escHtml(tok));
            } else if (tok === '=') {
                out.push(' = ');
            } else {
                out.push(`<span class="eq-var">${escHtml(tok)}</span>`);
            }
            i++;
        }
        return out.join('');
    }

    return parseExpression(0, tokens.length);
}

function renderEquations() {
    const container = document.getElementById('equations-container');
    container.innerHTML = '';

    for (const [label, eq] of Object.entries(rawEquations)) {
        const div = document.createElement('div');
        div.className = 'eq-box';

        const lbl = document.createElement('span');
        lbl.className = 'eq-label';
        lbl.textContent = label;

        const content = document.createElement('div');
        content.className = 'eq-content';

        if (eqMode === 'symbol') {
            content.innerHTML = toSymbolHtml(eq);
        } else {
            content.textContent = eq;
        }

        div.appendChild(lbl);
        div.appendChild(content);
        container.appendChild(div);
    }
}

// ── DOM REFS ──────────────────────────────────────────────────────
const dropzone     = document.getElementById('dropzone');
const imageInput   = document.getElementById('imageInput');
const fileChip     = document.getElementById('file-name');
const uploadBtn    = document.getElementById('uploadBtn');
const errorMsg     = document.getElementById('error-message');
const loader       = document.getElementById('loader');
const btnText      = document.getElementById('btn-text');
const btnIcon      = document.getElementById('btn-icon');
const statusBar    = document.getElementById('status-bar');

const ALL_SECTIONS = ['original','equations','truthtable','graph','schemdraw']
    .map(id => document.getElementById(`section-${id}`));

function activatePill(id) {
    const el = document.getElementById(`pill-${id}`);
    if (!el) return;
    el.classList.add('active');
    const s = el.querySelector('span');
    if (s) s.textContent = '✓';
}

function showCard(id, delay = 0) {
    const card = document.getElementById(`section-${id}`);
    if (!card) return;
    card.style.animationDelay = delay + 'ms';
    card.style.display = 'block';
}

// ── DRAG & DROP ───────────────────────────────────────────────────
dropzone.addEventListener('click', e => {
    // Open file dialog when clicking the dropzone (but not the upload button)
    if (e.target !== uploadBtn && !uploadBtn.contains(e.target)) imageInput.click();
});

imageInput.addEventListener('change', () => {
    if (imageInput.files.length > 0) {
        fileChip.textContent = `📎  ${imageInput.files[0].name}`;
        clearErr();
    }
});

// Make the entire document accept file drops
document.addEventListener('dragover', e => { 
    e.preventDefault(); 
    dropzone.classList.add('dragover'); 
});

document.addEventListener('dragleave', e => { 
    e.preventDefault();
    if (!e.relatedTarget || e.relatedTarget.nodeName === "HTML") {
        dropzone.classList.remove('dragover'); 
    }
});

document.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        imageInput.files = e.dataTransfer.files;
        fileChip.textContent = `📎  ${imageInput.files[0].name}`;
        clearErr();
    }
});

// ── MAIN HANDLER ──────────────────────────────────────────────────
uploadBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const file = imageInput.files[0];
    if (!file) { showErr('⚠  Please select or drop an image first.'); return; }

    clearErr();
    setBtnState('loading');
    ALL_SECTIONS.forEach(s => s.style.display = 'none');
    statusBar.style.display = 'none';
    rawEquations = {};

    const objURL = URL.createObjectURL(file);
    document.getElementById('original-img').src = objURL;
    showCard('original');
    statusBar.style.display = 'flex';
    activatePill('upload');

    setTimeout(() => {
        document.getElementById('section-original').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    const form = new FormData();
    form.append('image', file);

    try {
        // Fetch from the active API URL
        const res = await fetch(currentApiUrl, { method: 'POST', body: form });
        if (!res.ok) throw new Error(`Server error ${res.status}.`);
        const data = await res.json();

        let delay = 100;
        const STEP = 130;

        if (data.equations) {
            rawEquations = data.equations;
            renderEquations();
            setTimeout(() => { showCard('equations', 0); activatePill('equations'); }, delay);
            delay += STEP;
        }

        if (data.truth_table?.columns) {
            const cols = data.truth_table.columns;
            document.getElementById('tt-head').innerHTML =
                '<tr>' + cols.map(c => `<th>${escHtml(c)}</th>`).join('') + '</tr>';

            document.getElementById('tt-body').innerHTML =
                data.truth_table.rows.map(row =>
                    '<tr>' + cols.map((c, ci) => {
                        const v = row[c];
                        const cls = (v == 1) ? 'val-1' : (v == 0 ? 'val-0' : '');
                        return `<td class="${cls}">${escHtml(String(v))}</td>`;
                    }).join('') + '</tr>'
                ).join('');

            setTimeout(() => { showCard('truthtable', 0); activatePill('table'); }, delay);
            delay += STEP;
        }

        if (data.graphviz_image) {
            document.getElementById('graph-img').src = `data:image/png;base64,${data.graphviz_image}`;
            setTimeout(() => { showCard('graph', 0); activatePill('graph'); }, delay);
            delay += STEP;
        }

        if (data.schemdraw_images) {
            const sc = document.getElementById('schemdraw-container');
            sc.innerHTML = '';
            for (const [lbl, b64] of Object.entries(data.schemdraw_images)) {
                sc.insertAdjacentHTML('beforeend', `
                    <div class="img-box white-bg">
                        <div class="schem-label">⚙ Output: ${escHtml(lbl)}</div>
                        <img src="data:image/png;base64,${b64}" alt="Schematic ${escHtml(lbl)}" loading="lazy" />
                    </div>`);
            }
            setTimeout(() => { showCard('schemdraw', 0); activatePill('schem'); }, delay);
        }

        setTimeout(() => URL.revokeObjectURL(objURL), 8000);

    } catch (err) {
        console.error('[circuit.ai]', err);
        showErr(`⚠  ${err.message}`);
    } finally {
        setBtnState('idle');
    }
});

// ── HELPERS ───────────────────────────────────────────────────────
function setBtnState(s) {
    if (s === 'loading') {
        btnText.textContent = 'Processing…';
        btnIcon.textContent = '⟳';
        btnIcon.style.animation = 'spin 1s linear infinite';
        uploadBtn.disabled = true;
        loader.classList.add('active');
    } else {
        btnText.textContent = 'Analyze Circuit';
        btnIcon.textContent = '→';
        btnIcon.style.animation = '';
        uploadBtn.disabled = false;
        loader.classList.remove('active');
    }
}

function showErr(msg) { errorMsg.textContent = msg; }
function clearErr()   { errorMsg.textContent = ''; }

function escHtml(s) {
    return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const ss = document.createElement('style');
ss.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .op-sym { color: var(--accent); font-weight: 700; }
    .eq-var  { color: var(--text); }
`;
document.head.appendChild(ss);