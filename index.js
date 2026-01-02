const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// 1. Connect to Local MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/dieselTracker')
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB Connection Error:", err));

// 2. Data Schema (Matches Zoho Mapping)
const transactionSchema = new mongoose.Schema({
    zoho_id: { type: String, unique: true },
    type: String,
    liters: Number,
    supervisor: String,
    date: Date,
    status: { type: String, default: 'pending' } // Important for Tally later
});

const Transaction = mongoose.model('Transaction', transactionSchema);


// 3. Webhook Listener
app.post('/webhook', async (req, res) => {
    try {
        console.log("📥 Data received from Zoho:", req.body);


        const data = {
            ...req.body,
            // If zoho_id is missing, create a unique timestamp ID
            // This prevents the "duplicate key { zoho_id: null }" error
            zoho_id: req.body.zoho_id || `Z-TEMP-${Date.now()}`
        };

        const newEntry = new Transaction(data);
        await newEntry.save();

        console.log("💾 Saved to MongoDB successfully!");
        res.status(200).send("Received");
    } catch (error) {
        console.error(" Error:", error.message);
        // If it's still a duplicate error, tell the user
        if (error.code === 11000) {
            return res.status(400).send("Duplicate Record Detected");
        }
        res.status(500).send("Database Error");
    }
});

app.listen(3000, () => console.log(" Node.js Server listening on Port 3000"));