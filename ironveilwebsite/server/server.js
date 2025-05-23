const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your Stripe secret key (live mode)
const stripe = Stripe('sk_live_...MhDK');

// Your Discord webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1375593005599428648/hsFoT9G101Pt6-CVtNxYnQWuzlh5vm-njWcuRxjCTtP1QBrIXNm3F99sEaRFfjQB8qDt';

app.use(bodyParser.json());

// Enable CORS for your front-end domain (optional, adjust as needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Adjust origin in production
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/api/charge', async (req, res) => {
  const { token, discord, email, amount } = req.body;

  if (!token || !email || !amount) {
    return res.status(400).json({ success: false, message: 'Missing required parameters.' });
  }

  try {
    // Create a charge
    const charge = await stripe.charges.create({
      amount: amount * 100, // amount in cents
      currency: 'usd',
      source: token,
      receipt_email: email,
      description: `Ironveil Anti-Cheat Purchase: $${amount} USD`,
      metadata: { discord, email },
    });

    // Send embed to Discord webhook
    const embed = {
      embeds: [{
        title: "New Ironveil Purchase",
        color: 3447003,
        fields: [
          { name: "Amount", value: `$${amount} USD`, inline: true },
          { name: "Discord Username", value: discord || "Not provided", inline: true },
          { name: "Email", value: email, inline: true },
          { name: "Charge ID", value: charge.id }
        ],
        timestamp: new Date()
      }]
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed)
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Stripe charge or webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
