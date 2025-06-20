// Parse a CSV file and add the resulting items to the inventory.
// The first row must contain headers that match the inventory field keys
// (e.g. "name", "barcode", "amount"). Any barcode values in the CSV are ignored
// and new barcodes are generated during import.
export async function handleFileUpload(file) {
  const items = await parseCSVFile(file);
  if (items && items.length) {
    addItemsToInventory(items);
  }
}

// Reads a CSV file and converts it into an array of objects keyed by the
// header names. Empty lines are ignored.
export async function parseCSVFile(csvFile) {
  const text = await csvFile.text();
  return parseCSVText(text);
}

export function parseCSVText(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',').map(h => h.trim());
  const fields = typeof loadFields === 'function' ? loadFields() : [];
  const map = {};
  fields.forEach(f => {
    map[normalize(f.label)] = f.key;
    map[normalize(f.key)] = f.key;
  });
  const synonyms = { quantity: 'amount', qty: 'amount', code: 'barcode', price: 'price' };

  const headers = rawHeaders.map(h => {
    const norm = normalize(h);
    return map[norm] || synonyms[norm] || norm;
  });

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const item = {};
    headers.forEach((key, idx) => {
      item[key] = cols[idx] || '';
    });
    items.push(item);
  }
  return items;
}

function normalize(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function addItemsToInventory(items) {
  if (!Array.isArray(items)) return;
  let current = [];
  if (typeof loadItems === 'function') {
    current = loadItems();
  } else if (Array.isArray(window.inventory)) {
    current = window.inventory;
  }
  const fields = typeof loadFields === 'function' ? loadFields() : [];
  const barcodeField = fields.find(f => f.key === 'barcode');
  items.forEach(item => {
    if (barcodeField && typeof getNextBarcode === 'function') {
      item[barcodeField.key] = getNextBarcode();
    }
    current.push(item);
  });
  if (typeof saveItems === 'function') {
    saveItems(current);
    if (typeof renderItems === 'function') renderItems();
  } else {
    window.inventory = current;
  }
  console.log('Added items to inventory:', items);
}

// Wiring for file input when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('invoiceFile');
  const status = document.getElementById('invoiceStatus');
  if (!input) return;
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (status) status.textContent = 'Processing...';
    try {
      await handleFileUpload(file);
      if (status) status.textContent = 'Invoice processed.';
    } catch (err) {
      console.error(err);
      if (status) status.textContent = 'Failed to process invoice.';
    }
  });
});
