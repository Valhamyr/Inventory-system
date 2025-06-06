async function loadTypes() {
    if (githubEnabled()) {
        const data = await loadGitHubJson('data/types.json');
        return data || [];
    }
    const data = localStorage.getItem('inventoryTypes');
    return data ? JSON.parse(data) : [];
}

async function saveTypes(types) {
    if (githubEnabled()) {
        await saveGitHubJson('data/types.json', types, 'Update inventory types');
    } else {
        localStorage.setItem('inventoryTypes', JSON.stringify(types));
    }
}

async function renderTypes() {
    const types = await loadTypes();
    const ul = document.getElementById('types');
    ul.innerHTML = '';
    types.forEach(t => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `inventory.html?type=${encodeURIComponent(t)}`;
        link.textContent = t;
        li.appendChild(link);
        ul.appendChild(li);
    });
    renderTypeOptions();
}

async function addType(e) {
    e.preventDefault();
    const input = document.getElementById('typeName');
    const name = input.value.trim();
    if (!name) return;
    let types = await loadTypes();
    if (!types.includes(name)) {
        types.push(name);
        await saveTypes(types);
        renderTypes();
    }
    input.value = '';
}

async function loadItemsForType(type) {
    if (githubEnabled()) {
        const file = `data/items_${encodeURIComponent(type)}.json`;
        const data = await loadGitHubJson(file);
        return data || [];
    }
    const data = localStorage.getItem(`inventoryItems_${type}`);
    return data ? JSON.parse(data) : [];
}

async function saveItemsForType(type, items) {
    if (githubEnabled()) {
        const file = `data/items_${encodeURIComponent(type)}.json`;
        await saveGitHubJson(file, items, `Update items for ${type}`);
    } else {
        localStorage.setItem(`inventoryItems_${type}`, JSON.stringify(items));
    }
}

async function getNextBarcode(type) {
    const items = await loadItemsForType(type);
    let nextId = 1;
    items.forEach(item => {
        if (item.barcode && item.barcode.startsWith(`${type}-`)) {
            const num = parseInt(item.barcode.slice(type.length + 1), 10);
            if (!isNaN(num) && num >= nextId) {
                nextId = num + 1;
            }
        }
    });
    return `${type}-${nextId}`;
}

async function renderTypeOptions() {
    const select = document.getElementById('genType');
    if (!select) return;
    const types = await loadTypes();
    select.innerHTML = '';
    types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
}

async function handleGenerateBarcode(e) {
    e.preventDefault();
    const type = document.getElementById('genType').value;
    const name = document.getElementById('genName').value.trim();
    if (!type || !name) return;
    const items = await loadItemsForType(type);
    const barcode = await getNextBarcode(type);
    items.push({name, quantity: 0, barcode, notes: ''});
    await saveItemsForType(type, items);
    const svg = document.getElementById('generatedBarcode');
    JsBarcode(svg, barcode, {displayValue: true});
}

window.addEventListener('DOMContentLoaded', () => {
    (async () => {
        await renderTypes();
        document.getElementById('typeForm').addEventListener('submit', addType);
        const genForm = document.getElementById('generateForm');
        if (genForm) {
            genForm.addEventListener('submit', handleGenerateBarcode);
        }
        renderTypeOptions();
    })();
});
