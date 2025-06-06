export async function handleFileUpload(file) {
  const text = await extractTextFromPDF(file);
  const items = await sendTextToAPI(text);
  if (items) {
    addItemsToInventory(items);
  }
}

export async function extractTextFromPDF(pdfFile) {
  const buffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(it => it.str).join(' ');
    text += pageText + '\n';
  }
  return text;
}

export async function sendTextToAPI(text) {
  const response = await fetch('/api/parse-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!response.ok) throw new Error('API request failed');
  return response.json();
}

export function addItemsToInventory(items) {
  if (!Array.isArray(items)) return;
  let current = [];
  if (typeof loadItems === 'function') {
    current = loadItems();
  } else if (Array.isArray(window.inventory)) {
    current = window.inventory;
  }
  items.forEach(item => current.push(item));
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
