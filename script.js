const params = new URLSearchParams(location.search);
const inventoryType = params.get('type') || 'default';
const STORAGE_KEY = `inventoryItems_${inventoryType}`;
const FIELD_KEY = `inventoryFields_${inventoryType}`;
const DEFAULT_FIELDS = [
    {key: 'name', label: 'Name'},
    {key: 'barcode', label: 'Barcode'},
    {key: 'amount', label: 'Amount'},
    {key: 'material', label: 'Material', multiLine: true},
    {key: 'color', label: 'Color'},
    {key: 'store_url', label: 'Store URL'},
    {key: 'price', label: 'Price'},
    {key: 'notes', label: 'Notes', multiLine: true}
];

let selectedBarcode = null;

function loadFields() {
    const data = localStorage.getItem(FIELD_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(FIELD_KEY, JSON.stringify(DEFAULT_FIELDS));
    return DEFAULT_FIELDS.slice();
}

function saveFields(fields) {
    localStorage.setItem(FIELD_KEY, JSON.stringify(fields));
}

function editFields() {
    const current = loadFields();
    const labels = current.map(f => f.label).join(',');
    const input = prompt('Comma-separated field names (must include Barcode)', labels);
    if (!input) return;
    const newLabels = input.split(',').map(t => t.trim()).filter(t => t);
    if (!newLabels.some(l => l.toLowerCase() === 'barcode')) {
        alert('Fields must include Barcode');
        return;
    }
    const newFields = [];
    newLabels.forEach((label, idx) => {
        if (current[idx]) {
            newFields.push({key: current[idx].key, label, multiLine: current[idx].multiLine});
        } else {
            const key = label.toLowerCase().replace(/\s+/g, '_');
            newFields.push({key, label});
        }
    });
    if (newFields.length < current.length) {
        const removed = current.slice(newFields.length).map(f => f.key);
        let items = loadItems();
        items = items.map(it => {
            removed.forEach(k => delete it[k]);
            return it;
        });
        saveItems(items);
    }
    saveFields(newFields);
    renderEditFields();
    renderTableHeader();
    renderItems();
    const currentItem = loadItems().find(i => i.barcode === selectedBarcode);
    showItemDetails(currentItem || null);
}

document.addEventListener('DOMContentLoaded', () => {
    const title = document.getElementById('page-title');
    if (title) {
        title.textContent = `Inventory Tracker - ${inventoryType}`;
    }
});

function loadItems() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveItems(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let nextBarcodeCounter = null;

function getNextBarcode() {
    if (nextBarcodeCounter === null) {
        const items = loadItems();
        let maxId = 0;
        items.forEach(item => {
            if (item.barcode && item.barcode.startsWith(`${inventoryType}-`)) {
                const num = parseInt(item.barcode.slice(inventoryType.length + 1), 10);
                if (!isNaN(num) && num > maxId) {
                    maxId = num;
                }
            }
        });
        nextBarcodeCounter = maxId + 1;
    } else {
        nextBarcodeCounter++;
    }
    return `${inventoryType}-${nextBarcodeCounter}`;
}

function renderEditFields() {
    const fields = loadFields();
    const container = document.getElementById('selectedFields');
    if (!container) return;
    container.innerHTML = '';
    fields.forEach(f => {
        const label = document.createElement('label');
        label.textContent = f.label + ': ';
        let input;
        if (f.multiLine) {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = f.key === 'amount' ? 'number' : 'text';
            if (f.key === 'amount') input.min = '0';
        }
        input.id = `edit_${f.key}`;
        if (f.key === 'barcode') input.readOnly = true;
        label.appendChild(input);
        container.appendChild(label);
    });
}

function showItemDetails(item) {
    const form = document.getElementById('selectedForm');
    const msg = document.getElementById('noSelection');
    if (!form || !msg) return;
    if (!item) {
        form.style.display = 'none';
        msg.style.display = 'block';
        return;
    }
    msg.style.display = 'none';
    form.style.display = 'block';
    const fields = loadFields();
    fields.forEach(f => {
        const input = document.getElementById(`edit_${f.key}`);
        if (input) input.value = item[f.key] || '';
    });
}

function selectItemByBarcode(barcode) {
    selectedBarcode = barcode;
    document.querySelectorAll('#inventoryTable tbody tr').forEach(tr => {
        if (tr.dataset.barcode === barcode) {
            tr.classList.add('selected');
        } else {
            tr.classList.remove('selected');
        }
    });
    const item = loadItems().find(i => i.barcode === barcode);
    if (item) showItemDetails(item);
    else showItemDetails(null);
}


function renderTableHeader() {
    const fields = loadFields();
    const row = document.getElementById('headerRow');
    if (!row) return;
    row.innerHTML = '';
    const selectTh = document.createElement('th');
    const selectAll = document.createElement('input');
    selectAll.type = 'checkbox';
    selectAll.id = 'selectAllCheckbox';
    selectTh.appendChild(selectAll);
    row.appendChild(selectTh);
    fields.forEach(f => {
        const th = document.createElement('th');
        th.textContent = f.label;
        row.appendChild(th);
    });
    const actions = document.createElement('th');
    actions.textContent = 'Actions';
    row.appendChild(actions);
}

function renderItems() {
    const items = loadItems();
    const fields = loadFields();
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';
    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.dataset.barcode = item.barcode;
        if (selectedBarcode === item.barcode) {
            tr.classList.add('selected');
        }
        const checkTd = document.createElement('td');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'row-select';
        checkTd.appendChild(cb);
        tr.appendChild(checkTd);
        fields.forEach(f => {
            const td = document.createElement('td');
            if (f.key === 'barcode') {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.classList.add('barcode');
                svg.dataset.code = item[f.key] || '';
                td.appendChild(svg);
            } else {
                td.textContent = item[f.key] || '';
            }
            tr.appendChild(td);
        });
        const act = document.createElement('td');
        act.innerHTML = `<button data-delete="${item.barcode}">Delete</button>`;
        tr.appendChild(act);
        tbody.appendChild(tr);
    });
    document.querySelectorAll('svg.barcode').forEach(svg => {
        const code = svg.dataset.code;
        if (code) JsBarcode(svg, code, {displayValue: true});
    });
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) selectAll.checked = false;
    if (selectedBarcode) {
        selectItemByBarcode(selectedBarcode);
    }
}

function updateSelectedItem(e) {
    e.preventDefault();
    if (!selectedBarcode) return;
    let items = loadItems();
    const item = items.find(i => i.barcode === selectedBarcode);
    if (!item) return;
    const fields = loadFields();
    fields.forEach(f => {
        const input = document.getElementById(`edit_${f.key}`);
        if (!input) return;
        const val = input.value.trim();
        if (f.key === 'amount') {
            item[f.key] = parseInt(val, 10) || 0;
        } else {
            item[f.key] = val;
        }
    });
    saveItems(items);
    renderItems();
    selectItemByBarcode(selectedBarcode);
}

function handleAddItem(e) {
    e.preventDefault();
    const name = document.getElementById('newItemName').value.trim();
    if (!name) return;
    let items = loadItems();
    const barcode = getNextBarcode();
    const newItem = {};
    const fields = loadFields();
    fields.forEach(f => {
        if (f.key === 'name') {
            newItem[f.key] = name;
        } else if (f.key === 'barcode') {
            newItem[f.key] = barcode;
        } else if (f.key === 'amount') {
            newItem[f.key] = 0;
        } else {
            newItem[f.key] = '';
        }
    });
    items.push(newItem);
    saveItems(items);
    JsBarcode(document.getElementById('newItemBarcode'), barcode, {displayValue: true});
    renderItems();
    selectItemByBarcode(barcode);
    e.target.reset();
}

function handleTableClick(e) {
    if (e.target.closest('input.row-select')) return;
    const delBarcode = e.target.dataset.delete;
    if (e.target.hasAttribute('data-delete')) {
        let items = loadItems().filter(i => i.barcode !== delBarcode);
        saveItems(items);
        renderItems();
        if (selectedBarcode === delBarcode) {
            selectedBarcode = null;
            showItemDetails(null);
        }
    } else {
        const row = e.target.closest('tr');
        if (row && row.dataset.barcode) {
            selectItemByBarcode(row.dataset.barcode);
        }
    }
}

function handleBarcodeInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const code = e.target.value.trim();
        if (code) {
            const item = loadItems().find(i => i.barcode === code);
            if (item) {
                selectItemByBarcode(code);
            } else {
                selectedBarcode = null;
                showItemDetails(null);
            }
            e.target.value = '';
        }
    }
}

async function processInvoiceFile(file) {
    const text = await file.text();
    parseInvoiceCSV(text);
}

function parseInvoiceCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;
    const rawHeaders = lines[0].split(',').map(h => h.trim());
    const fields = loadFields();
    const map = {};
    fields.forEach(f => {
        map[normalize(f.label)] = f.key;
        map[normalize(f.key)] = f.key;
    });
    const synonyms = { quantity: 'amount', qty: 'amount', code: 'barcode', price: 'price' };
    const headers = rawHeaders.map(h => {
        const n = normalize(h);
        return map[n] || synonyms[n] || n;
    });
    let items = loadItems();
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        const item = {};
        headers.forEach((key, idx) => {
            item[key] = cols[idx] || '';
        });
        if (!item['barcode']) {
            item['barcode'] = getNextBarcode();
        }
        items.push(item);
    }
    saveItems(items);
}

function normalize(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function handleProcessInvoice() {
    const input = document.getElementById('invoiceFile');
    const status = document.getElementById('invoiceStatus');
    if (!input || !input.files.length) {
        if (status) status.textContent = 'Select a CSV file.';
        return;
    }
    if (status) status.textContent = 'Processing...';
    try {
        await processInvoiceFile(input.files[0]);
        if (status) status.textContent = 'Invoice processed.';
        renderItems();
    } catch (err) {
        console.error(err);
        if (status) status.textContent = 'Failed to process invoice.';
    }
}

function handleSelectAll(e) {
    const checked = e.target.checked;
    document.querySelectorAll('#inventoryTable tbody input.row-select').forEach(cb => {
        cb.checked = checked;
    });
}

function handlePrintSelected() {
    const checkboxes = Array.from(document.querySelectorAll('#inventoryTable tbody input.row-select:checked'));
    if (!checkboxes.length) {
        alert('Select items to print');
        return;
    }
    const codes = checkboxes.map(cb => cb.closest('tr').dataset.barcode);
    const items = loadItems().filter(it => codes.includes(it.barcode));
    const nameField = loadFields().find(f => f.key === 'name');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write('<!DOCTYPE html><html><head><title>Print Barcodes</title>');
    win.document.write('<style>body{font-family:Arial;} .code{margin:1rem;}</style>');
    win.document.write('</head><body>');
    items.forEach(it => {
        win.document.write('<div class="code">');
        win.document.write(`<svg class="barcode" data-code="${it.barcode}"></svg>`);
        if (nameField) win.document.write(`<div>${it[nameField.key] || ''}</div>`);
        win.document.write('</div>');
    });
    win.document.write('<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>');
    win.document.write('<script>window.onload=function(){document.querySelectorAll("svg.barcode").forEach(function(s){JsBarcode(s,s.dataset.code,{displayValue:true});});};<\/script>');
    win.document.write('</body></html>');
    win.document.close();
    win.focus();
    win.print();
}

window.addEventListener('DOMContentLoaded', () => {
    renderEditFields();
    renderTableHeader();
    renderItems();
    const addForm = document.getElementById('addItemForm');
    if (addForm) addForm.addEventListener('submit', handleAddItem);
    const selForm = document.getElementById('selectedForm');
    if (selForm) selForm.addEventListener('submit', updateSelectedItem);
    document.querySelector('#inventoryTable tbody').addEventListener('click', handleTableClick);
    document.getElementById('barcodeInput').addEventListener('keydown', handleBarcodeInput);
    const btn = document.getElementById('editFieldsBtn');
    if (btn) btn.addEventListener('click', editFields);
    // Invoice processing is now handled by invoiceModule.js via the file input
    const selectAllBox = document.getElementById('selectAllCheckbox');
    if (selectAllBox) selectAllBox.addEventListener('change', handleSelectAll);
    const printBtn = document.getElementById('printSelectedBtn');
    if (printBtn) printBtn.addEventListener('click', handlePrintSelected);
    const initialBarcode = params.get('barcode');
    if (initialBarcode) {
        selectItemByBarcode(initialBarcode);
    }
});
