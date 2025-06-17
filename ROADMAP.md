# Project Roadmap

This file outlines planned development milestones for the inventory tracker.

## Current Functionality
- Tracks inventory items locally in the browser using `localStorage`.
- Supports barcode scanning or manual entry.
- Displays barcodes using JsBarcode.
- Allows adding, updating, and deleting items.

## Upcoming Features
1. **Cloud-Based Storage**
   - *Completed*: inventory data is now saved to an SQL database via the Node server.
2. **Storage Groups**
   - Support multiple inventories (e.g., fabrics vs. filament) so items can be organized into separate databases.
3. **Automatic Barcode Generation**
   - Generate unique barcodes from item name and type to prevent duplicates and standardize the format.
4. **Barcode Scanning Navigation**
   - When a barcode is scanned, automatically open the correct group and highlight the corresponding item entry.
5. **Light/Dark Mode**
   - Provide a user-selectable theme for light or dark appearance throughout the site.

## Future Considerations
- User authentication for multi-user access.
- Mobile optimizations and progressive web app support.
- Import/export features for backups and migrations.

