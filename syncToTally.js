const mongoose = require('mongoose');
const axios = require('axios');

// 1. Connect to Local MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/dieselTracker')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 2. Define the Schema (Matches your MongoDB entry)
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    type: String,
    liters: Number,
    supervisor: String,
    date: Date,
    status: { type: String, default: 'pending' }
}), 'transactions');

async function pushToTally() {
    try {
        // Find records that need to be synced
        const pendingData = await Transaction.find({ status: 'pending' });

        if (pendingData.length === 0) {
            console.log("No pending records to sync.");
            return;
        }

        for (let record of pendingData) {
            const supervisor = record.supervisor || "Unknown";
            const qty = record.liters || 0;
            const mongoId = record._id.toString();

            // Tally EDU mode only accepts the 1st or 2nd of a month.
            // We use 20250401 (1-Apr-2025) to match your Tally period.
            const formattedDate = "20250401";

            // 4. Optimized Tally XML
            const tallyXML = `
            <ENVELOPE>
                <HEADER>
                    <TALLYREQUEST>Import Data</TALLYREQUEST>
                </HEADER>
                <BODY>
                    <IMPORTDATA>
                        <REQUESTDESC>
                            <REPORTNAME>Vouchers</REPORTNAME>
                            <STATICVARIABLES>
                                <SVCURRENTCOMPANY>Diesel Sync Project</SVCURRENTCOMPANY>
                            </STATICVARIABLES>
                        </REQUESTDESC>
                        <REQUESTDATA>
                            <TALLYMESSAGE xmlns:UDF="TallyUDF">
                                <VOUCHER VCHTYPE="Journal" ACTION="Create" OBJTYPE="Voucher">
                                    <DATE>${formattedDate}</DATE>
                                    <GUID>${mongoId}</GUID>
                                    <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>
                                    <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
                                    <NARRATION>Supervisor: ${supervisor} | Sync ID: ${mongoId}</NARRATION>
                                    <ALLLEDGERENTRIES.LIST>
                                        <LEDGERNAME>Diesel Expenses</LEDGERNAME>
                                        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                                        <AMOUNT>-${qty}</AMOUNT>
                                    </ALLLEDGERENTRIES.LIST>
                                    <ALLLEDGERENTRIES.LIST>
                                        <LEDGERNAME>Cash</LEDGERNAME>
                                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                                        <AMOUNT>${qty}</AMOUNT>
                                    </ALLLEDGERENTRIES.LIST>
                                </VOUCHER>
                            </TALLYMESSAGE>
                        </REQUESTDATA>
                    </IMPORTDATA>
                </BODY>
            </ENVELOPE>`;

            // 5. Send to Tally
            const response = await axios.post('http://localhost:9000', tallyXML, {
                headers: { 'Content-Type': 'text/xml' }
            });

            // 6. Handle Response
            if (response.data.includes('<CREATED>1</CREATED>')) {
                record.status = 'synced';
                await record.save();
                console.log(`✅ SUCCESS! Record for ${supervisor} synced to Tally.`);
            } else {
                console.log("❌ Tally rejected the request. Response below:");
                console.log(response.data);
            }
        }
    } catch (error) {
        console.error("Connection Error (Check if Tally is open on Port 9000):", error.message);
    } finally {
        mongoose.connection.close();
    }
}

// Run the script
pushToTally();