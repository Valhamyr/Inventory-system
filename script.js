const params = new URLSearchParams(location.search);
const inventoryType = params.get('type') || 'default';
const STORAGE_KEY = `inventoryItems_${inventoryType}`;
const FIELD_KEY = `inventoryFields_${inventoryType}`;
const DEFAULT_FIELDS = [
    {key: 'name', label: 'Name'},
    {key: 'quantity', label: 'Qty'},
    {key: 'barcode', label: 'Barcode'},
    {key: 'notes', label: 'Notes'}
];

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
            newFields.push({key: current[idx].key, label});
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
    renderFormFields();
    renderTableHeader();
    renderItems();
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

function renderFormFields() {
    const fields = loadFields();
    const container = document.getElementById('formFields');
    if (!container) return;
    container.innerHTML = '';
    fields.forEach(f => {
        const label = document.createElement('label');
        label.textContent = f.label + ': ';
        const input = document.createElement('input');
        input.id = `field_${f.key}`;
        input.type = f.key === 'quantity' ? 'number' : 'text';
        if (f.key === 'quantity') input.min = '0';
        if (f.key === 'barcode') input.required = true;
        label.appendChild(input);
        container.appendChild(label);
    });
}

function renderTableHeader() {
    const fields = loadFields();
    const row = document.getElementById('headerRow');
    if (!row) return;
    row.innerHTML = '';
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
        act.innerHTML = `<button data-edit="${item.barcode}">Edit</button> <button data-delete="${item.barcode}">Delete</button>`;
        tr.appendChild(act);
        tbody.appendChild(tr);
    });
    document.querySelectorAll('svg.barcode').forEach(svg => {
        const code = svg.dataset.code;
        if (code) JsBarcode(svg, code, {displayValue: true});
    });
}

function addOrUpdateItem(e) {
    e.preventDefault();
    const fields = loadFields();
    const newItem = {};
    fields.forEach(f => {
        const val = document.getElementById(`field_${f.key}`).value.trim();
        if (f.key === 'quantity') {
            newItem[f.key] = parseInt(val, 10) || 0;
        } else {
            newItem[f.key] = val;
        }
    });
    if (!newItem.barcode) return;
    let items = loadItems();
    const existing = items.find(i => i.barcode === newItem.barcode);
    if (existing) {
        fields.forEach(f => {
            existing[f.key] = newItem[f.key];
        });
    } else {
        items.push(newItem);
    }
    saveItems(items);
    renderItems();
    e.target.reset();
}

function handleTableClick(e) {
    const editBarcode = e.target.dataset.edit;
    const delBarcode = e.target.dataset.delete;
    if (editBarcode) {
        const item = loadItems().find(i => i.barcode === editBarcode);
        if (item) {
            const fields = loadFields();
            fields.forEach(f => {
                const input = document.getElementById(`field_${f.key}`);
                if (input) {
                    input.value = item[f.key] || '';
                }
            });
        }
    } else if (delBarcode) {
        let items = loadItems().filter(i => i.barcode !== delBarcode);
        saveItems(items);
        renderItems();
    }
}

function handleBarcodeInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const code = e.target.value.trim();
        if (code) {
            const barcodeInput = document.getElementById('field_barcode');
            if (barcodeInput) barcodeInput.value = code;
            const item = loadItems().find(i => i.barcode === code);
            const fields = loadFields();
            if (item) {
                fields.forEach(f => {
                    const input = document.getElementById(`field_${f.key}`);
                    if (input) input.value = item[f.key] || '';
                });
            } else {
                document.getElementById('itemForm').reset();
                if (barcodeInput) barcodeInput.value = code;
            }
            e.target.value = '';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    renderFormFields();
    renderTableHeader();
    renderItems();
    document.getElementById('itemForm').addEventListener('submit', addOrUpdateItem);
    document.querySelector('#inventoryTable tbody').addEventListener('click', handleTableClick);
    document.getElementById('barcodeInput').addEventListener('keydown', handleBarcodeInput);
    const btn = document.getElementById('editFieldsBtn');
    if (btn) btn.addEventListener('click', editFields);
});
