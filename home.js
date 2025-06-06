function loadTypes() {
    const data = localStorage.getItem('inventoryTypes');
    return data ? JSON.parse(data) : [];
}

function saveTypes(types) {
    localStorage.setItem('inventoryTypes', JSON.stringify(types));
}

function renderTypes() {
    const types = loadTypes();
    const ul = document.getElementById('types');
    ul.innerHTML = '';
    types.forEach(t => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `inventory.html?type=${encodeURIComponent(t)}`;
        link.textContent = t;
        li.appendChild(link);
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.dataset.delete = t;
        delBtn.style.marginLeft = '0.5rem';
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
    renderTypeOptions();
}

function addType(e) {
    e.preventDefault();
    const input = document.getElementById('typeName');
    const name = input.value.trim();
    if (!name) return;
    let types = loadTypes();
    if (!types.includes(name)) {
        types.push(name);
        saveTypes(types);
        renderTypes();
    }
    input.value = '';
}

function loadItemsForType(type) {
    const data = localStorage.getItem(`inventoryItems_${type}`);
    return data ? JSON.parse(data) : [];
}

function saveItemsForType(type, items) {
    localStorage.setItem(`inventoryItems_${type}`, JSON.stringify(items));
}

function getNextBarcode(type) {
    const items = loadItemsForType(type);
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

function renderTypeOptions() {
    const select = document.getElementById('genType');
    if (!select) return;
    const types = loadTypes();
    select.innerHTML = '';
    types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
    });
}

function handleGenerateBarcode(e) {
    e.preventDefault();
    const type = document.getElementById('genType').value;
    const name = document.getElementById('genName').value.trim();
    if (!type || !name) return;
    const items = loadItemsForType(type);
    const barcode = getNextBarcode(type);
    items.push({name, quantity: 0, barcode, notes: ''});
    saveItemsForType(type, items);
    const svg = document.getElementById('generatedBarcode');
    JsBarcode(svg, barcode, {displayValue: true});
}

function deleteType(name) {
    if (!confirm(`Delete type "${name}" and all its data?`)) return;
    let types = loadTypes().filter(t => t !== name);
    saveTypes(types);
    localStorage.removeItem(`inventoryItems_${name}`);
    localStorage.removeItem(`inventoryFields_${name}`);
    renderTypes();
}

function handleTypeListClick(e) {
    const name = e.target.dataset.delete;
    if (name) {
        deleteType(name);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    renderTypes();
    document.getElementById('typeForm').addEventListener('submit', addType);
    const genForm = document.getElementById('generateForm');
    if (genForm) {
        genForm.addEventListener('submit', handleGenerateBarcode);
    }
    const typeList = document.getElementById('types');
    if (typeList) {
        typeList.addEventListener('click', handleTypeListClick);
    }
    renderTypeOptions();
});
