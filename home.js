async function loadTypes() {
    const res = await fetch('/api/types');
    if (!res.ok) return [];
    return await res.json();
}

async function saveType(name) {
    await fetch('/api/types', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name})
    });
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
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.dataset.delete = t;
        delBtn.style.marginLeft = '0.5rem';
        li.appendChild(delBtn);
        ul.appendChild(li);
    });
    renderTypeOptions();
}

async function addType(e) {
    e.preventDefault();
    const input = document.getElementById('typeName');
    const name = input.value.trim();
    if (!name) return;
    await saveType(name);
    renderTypes();
    input.value = '';
}

async function loadItemsForType(type) {
    const res = await fetch(`/api/items/${encodeURIComponent(type)}`);
    if (!res.ok) return [];
    return await res.json();
}

async function saveItemForType(type, item) {
    await fetch(`/api/items/${encodeURIComponent(type)}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(item)
    });
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
    const barcode = await getNextBarcode(type);
    await saveItemForType(type, {name, amount: 0, barcode, notes: ''});
    const svg = document.getElementById('generatedBarcode');
    JsBarcode(svg, barcode, {displayValue: true});
}

async function deleteType(name) {
    if (!confirm(`Delete type "${name}" and all its data?`)) return;
    await fetch(`/api/types/${encodeURIComponent(name)}`, { method: 'DELETE' });
    renderTypes();
}

function handleTypeListClick(e) {
    const name = e.target.dataset.delete;
    if (name) {
        deleteType(name);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const host = document.getElementById('dbHost').value.trim();
    const user = document.getElementById('dbUser').value.trim();
    const pass = document.getElementById('dbPass').value;
    const database = document.getElementById('dbName').value.trim();
    const msg = document.getElementById('loginMessage');
    msg.textContent = '';
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({host, user, password: pass, database})
        });
        if (!res.ok) throw new Error();
        msg.textContent = 'Connected to database';
        renderTypes();
    } catch {
        msg.textContent = 'Failed to connect';
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
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleSearch(e) {
    e.preventDefault();
    const code = document.getElementById('searchInput').value.trim();
    const msg = document.getElementById('searchMessage');
    if (!code) return;
    const types = await loadTypes();
    for (const t of types) {
        const items = await loadItemsForType(t);
        if (items.find(it => it.barcode === code)) {
            location.href = `inventory.html?type=${encodeURIComponent(t)}&barcode=${encodeURIComponent(code)}`;
            return;
        }
    }
    if (msg) msg.textContent = 'Item not found';
}
