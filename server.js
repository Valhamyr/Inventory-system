const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json({limit: '2mb'}));

app.post('/api/parse-invoice', async (req, res) => {
  const text = req.body && req.body.text;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract invoice line items from the given text. Respond with a JSON array of objects {"name": string, "amount": number, "price": number}.'
          },
          { role: 'user', content: text }
        ],
        temperature: 0.2
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI error', openaiRes.status, errText);
      return res.status(500).json({ error: 'OpenAI request failed' });
    }

    const data = await openaiRes.json();
    const content = data.choices && data.choices[0].message.content.trim();
    let items;
    try {
      items = JSON.parse(content);
    } catch (err) {
      console.error('Parse error', err);
      return res.status(500).json({ error: 'Failed to parse OpenAI response' });
    }
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
