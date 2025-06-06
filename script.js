const params = new URLSearchParams(location.search);
const inventoryType = params.get('type') || 'default';
const STORAGE_KEY = `inventoryItems_${inventoryType}`;

document.addEventListener('DOMContentLoaded', () => {
    const title = document.getElementById('page-title');
    if (title) {
        title.textContent = `Inventory Tracker - ${inventoryType}`;
    }
});

async function loadItems() {
    if (githubEnabled()) {
        const file = `data/items_${encodeURIComponent(inventoryType)}.json`;
        const data = await loadGitHubJson(file);
        return data || [];
    }
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

async function saveItems(items) {
    if (githubEnabled()) {
        const file = `data/items_${encodeURIComponent(inventoryType)}.json`;
        await saveGitHubJson(file, items, `Update items for ${inventoryType}`);
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
}

async function renderItems() {
    const items = await loadItems();
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';
    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td><svg class="barcode" data-code="${item.barcode}"></svg></td>
            <td>${item.notes || ''}</td>
            <td>
                <button data-edit="${item.barcode}">Edit</button>
                <button data-delete="${item.barcode}">Delete</button>
            </td>`;
        tbody.appendChild(tr);
    });
    document.querySelectorAll('svg.barcode').forEach(svg => {
        JsBarcode(svg, svg.dataset.code, {displayValue: true});
    });
}

async function addOrUpdateItem(e) {
    e.preventDefault();
    const name = document.getElementById('itemName').value.trim();
    const quantity = parseInt(document.getElementById('itemQty').value, 10) || 0;
    const barcode = document.getElementById('itemBarcode').value.trim();
    const notes = document.getElementById('itemNotes').value.trim();
    if (!barcode) return;
    let items = await loadItems();
    const existing = items.find(i => i.barcode === barcode);
    if (existing) {
        existing.name = name;
        existing.quantity = quantity;
        existing.notes = notes;
    } else {
        items.push({name, quantity, barcode, notes});
    }
    await saveItems(items);
    renderItems();
    e.target.reset();
}

async function handleTableClick(e) {
    const editBarcode = e.target.dataset.edit;
    const delBarcode = e.target.dataset.delete;
    if (editBarcode) {
        const item = (await loadItems()).find(i => i.barcode === editBarcode);
        if (item) {
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemQty').value = item.quantity;
            document.getElementById('itemBarcode').value = item.barcode;
            document.getElementById('itemNotes').value = item.notes;
        }
    } else if (delBarcode) {
        let items = (await loadItems()).filter(i => i.barcode !== delBarcode);
        await saveItems(items);
        renderItems();
    }
}

async function handleBarcodeInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const code = e.target.value.trim();
        if (code) {
            document.getElementById('itemBarcode').value = code;
            const item = (await loadItems()).find(i => i.barcode === code);
            if (item) {
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemQty').value = item.quantity;
                document.getElementById('itemNotes').value = item.notes;
            } else {
                document.getElementById('itemForm').reset();
                document.getElementById('itemBarcode').value = code;
            }
            e.target.value = '';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    (async () => {
        await renderItems();
        document.getElementById('itemForm').addEventListener('submit', addOrUpdateItem);
        document.querySelector('#inventoryTable tbody').addEventListener('click', handleTableClick);
        document.getElementById('barcodeInput').addEventListener('keydown', handleBarcodeInput);
    })();
});
