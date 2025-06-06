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
        ul.appendChild(li);
    });
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

window.addEventListener('DOMContentLoaded', () => {
    renderTypes();
    document.getElementById('typeForm').addEventListener('submit', addType);
});
