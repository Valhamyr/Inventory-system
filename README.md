# Inventory Tracker

A lightweight web-based inventory tracking application that works with Bluetooth barcode scanners. Data can now be persisted to an SQL database via a small Node server. Barcodes are rendered using [JsBarcode](https://github.com/lindell/JsBarcode).

## Features
- Manage multiple inventory types
- Delete inventory types from the home page
- Add, update, and remove inventory items
- Scan barcodes with a Bluetooth scanner or type them manually
- Data can be stored in an SQL database via the Node server
- Barcodes for each item are displayed in the table
- Generate new item barcodes from the home page
- Responsive layout for desktop and mobile
- Default item fields include Name, Barcode, Amount, Material, Color, Store URL,
  Price and Notes. Material and Notes support multiline input.

## Usage
1. Open `index.html` in your browser to see a list of inventory types.
2. Create a new type or select an existing one to open its inventory page.
3. Delete a type using the **Delete** button if you no longer need it.
4. Use the **Generate Item Barcode** section on the home page to create a barcode for a new item.
5. On the inventory page scan a barcode into the **Scan Barcode** field or type it manually and press **Enter**.
6. Fill in the item details and submit the form to add or update the item.
7. Inventory items appear in the table where you can edit or delete them.
8. To persist data, start the Node server with your `.env` configuration and the pages will communicate with it for storage.

## Deployment
This project can be hosted on GitHub Pages. In your repository settings, enable **GitHub Pages** for the `main` branch (or the branch containing this code) and select the root directory.

## Importing Items from CSV

The invoice upload feature now accepts comma separated value (`.csv`) files.
Each row in the CSV should correspond to an inventory item and include column
headers that match your field names (for example `name,barcode,amount`).
When a CSV file is selected on the inventory page the items are parsed directly
in the browser and added to your local inventory. Header names are matched
case-insensitively to your inventory fields and common synonyms like `quantity`
or `code` are recognized automatically. Any barcode values present in the CSV
are ignored—the application always generates a new barcode for each imported
row.

The repository includes `mock_inventory_fabrics.csv` as a sample file that you
can use to test the import feature.

## Server Configuration
Create a `.env` file based on `.env.example` and provide your database connection details. You can also supply the connection information from the home page using the **Connect to Database** form. Start the server with `npm start` and the front-end will read and write data through the exposed API.

The configuration accepts an optional `DB_PORT` (default `1433`). Include this value in your `.env` file or the login form if your SQL server listens on a non-standard port.
