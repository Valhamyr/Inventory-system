const API_BASE_URL = localStorage.getItem('apiBaseUrl') || '';

export async function migrateLocalData() {
  const types = JSON.parse(localStorage.getItem('inventoryTypes') || '[]');
  for (const type of types) {
    await fetch(`${API_BASE_URL}/api/types`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: type})
    });
    const items = JSON.parse(localStorage.getItem(`inventoryItems_${type}`) || '[]');
    for (const it of items) {
      await fetch(`${API_BASE_URL}/api/items/${encodeURIComponent(type)}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(it)
      });
    }
  }
  console.log('Migration complete');
}
