Fix and implement the marketplace system so it behaves like a real connected website.

Current problems:

Seller accounts are not being created correctly.

Buyer accounts are not being created correctly.

Logging in with the same credentials after signup does not work.

When sellers add materials or update stock, it does not appear in the inventory.

Buyer dashboard does not show materials added by sellers.

Required functionality:

Implement a working authentication system for both buyers and sellers with proper signup and login functionality.

When a user creates an account, the credentials should be stored so they can log in later using the same email and password.

Keep buyer accounts and seller accounts stored separately but functioning within the same system.

After seller login, redirect to a Seller Dashboard where sellers can:

Add materials

Update stock

Edit material details

View their inventory.

When a seller adds a material (material name, category, price, quantity, image, location), it must immediately be stored in the system inventory.

When a seller updates the stock quantity, the inventory must update instantly.

The Buyer Dashboard should display all materials added by all sellers in a marketplace view using cards or table format.

Each material shown to buyers must include:

Material name

Category

Price

Available stock

Seller name

Location

Material image.

The seller inventory and buyer marketplace must be connected so that when a seller adds or updates materials, the changes appear automatically in the buyer dashboard.

Ensure the system works like a real website where:

accounts persist after refresh

login sessions work correctly

inventory is shared across seller and buyer dashboards.