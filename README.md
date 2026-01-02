# Diesel Sync Project

This project automates the syncing of diesel transaction data from Zoho to Tally Prime via a local MongoDB database. It consists of a webhook listener that receives data from Zoho and a sync script that pushes pending transactions to Tally.

## Prerequisites

Before running this project, ensure you have the following installed and running:

*   **Node.js**: [Download & Install Node.js](https://nodejs.org/)
*   **MongoDB**: Ensure MongoDB is running locally at `mongodb://127.0.0.1:27017`.
    *   Database Name: `dieselTracker`
*   **Tally Prime**: Must be running with "Server Access" enabled.
    *   Port: `9000` (Default)
    *   Company Name: `Diesel Sync Project` (Must match the XML configuration in `syncToTally.js`)

## Installation

1.  Clone or download the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

The project uses the following default configurations:
*   **MongoDB URL**: `mongodb://127.0.0.1:27017/dieselTracker`
*   **Server Port**: `3000`
*   **Tally URL**: `http://localhost:9000`

If you need to change these, please modify `index.js` and `syncToTally.js` respectively.

## Usage

### 1. Start the Webhook Server
This server listens for incoming data from Zoho.

```bash
node index.js
```
*   Server will start on `http://localhost:3000`.
*   **Endpoint**: `POST /webhook`

### 2. Sync to Tally
Run this script to push all "pending" transactions from MongoDB to Tally.

```bash
node syncToTally.js
```
*   It fetches records with `status: 'pending'`.
*   Generates Tally-compatible XML.
*   Pushes data to Tally (Tally must be open).
*   Updates status to `synced` on success.

## API Endpoints

### POST /webhook
Receives transaction data.

**Payload Structure:**
```json
{
  "zoho_id": "12345",
  "type": "Diesel",
  "liters": 50,
  "supervisor": "John Doe",
  "date": "2025-04-01T10:00:00Z"
}
```

## Troubleshooting

*   **MongoDB Connection Error**: Ensure the MongoDB service is running.
*   **Tally Connection Refused**: Verify Tally is open and the Server Port is set to `9000` in F12 Configuration.
*   **Duplicate Record**: The system prevents duplicate `zoho_id` entries.
