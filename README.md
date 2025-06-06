# Inventory Tracker

A lightweight web-based inventory tracking application that works with Bluetooth barcode scanners and stores data in your browser's localStorage by default. Barcodes are rendered using [JsBarcode](https://github.com/lindell/JsBarcode).

The app can also use a GitHub repository for persistent storage when a GitHub personal access token is provided.

## Features
- Manage multiple inventory types
- Add, update, and remove inventory items
- Scan barcodes with a Bluetooth scanner or type them manually
- Data is stored locally in your browser (no server required)
- Barcodes for each item are displayed in the table
- Generate new item barcodes from the home page
- Responsive layout for desktop and mobile

## Usage
1. Open `index.html` in your browser to see a list of inventory types.
2. Create a new type or select an existing one to open its inventory page.
3. Use the **Generate Item Barcode** section on the home page to create a barcode for a new item.
4. On the inventory page scan a barcode into the **Scan Barcode** field or type it manually and press **Enter**.
5. Fill in the item details and submit the form to add or update the item.
6. Inventory items appear in the table where you can edit or delete them.

## GitHub Storage (Optional)
To make inventory data available across devices, configure `github.js` with a GitHub repository and a personal access token. When `githubConfig` contains an owner, repo, and token, the app will load and save JSON files in that repository instead of using `localStorage`.

## Deployment
This project can be hosted on GitHub Pages. In your repository settings, enable **GitHub Pages** for the `main` branch (or the branch containing this code) and select the root directory.
