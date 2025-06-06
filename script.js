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
    const current = loadItems().find(i => i.barcode === selectedBarcode);
    showItemDetails(current || null);
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

function getNextBarcode() {
    const items = loadItems();
    let nextId = 1;
    items.forEach(item => {
        if (item.barcode && item.barcode.startsWith(`${inventoryType}-`)) {
            const num = parseInt(item.barcode.slice(inventoryType.length + 1), 10);
            if (!isNaN(num) && num >= nextId) {
                nextId = num + 1;
            }
        }
    });
    return `${inventoryType}-${nextId}`;
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
    const delBarcode = e.target.dataset.delete;
    if (delBarcode) {
        let items = loadItems().filter(i => i.barcode !== delBarcode);
        saveItems(items);
        renderItems();
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
    const initialBarcode = params.get('barcode');
    if (initialBarcode) {
        selectItemByBarcode(initialBarcode);
    }
});
