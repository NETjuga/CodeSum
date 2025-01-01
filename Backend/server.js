require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');
const app = express();
const port = 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const agent = new https.Agent({
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
});

app.use(cors());
app.use(express.json());

app.post('/api/summarize', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            agent,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Host': 'api.openai.com'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert code analyst. Provide three distinct, clearly labeled sections."
                    },
                    {
                        role: "user",
                        content: `Analyze this code: ${text}

Please provide your response in the following format:

[KEY FUNCTIONS]
- List each key function
- Describe its purpose
- Explain its role in the code

[DETAILED EXPLANATION]
Provide a comprehensive technical explanation of the code, including:
- Overall purpose
- Detailed functionality
- Potential improvements
- Best practices

[FULL CODE]
Only the clean, formatted code syntax without any additional explanation.`
                    }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('API Error Body:', errorBody);
            return res.status(response.status).json({ error: errorBody });
        }

        const data = await response.json();
        const responseContent = data.choices[0].message.content;

        // More robust parsing of the response
        const parseSection = (sectionName, content) => {
            const sectionRegex = new RegExp(`\\[${sectionName}\\]([\\s\\S]*?)(?=\\[|$)`, 'i');
            const match = content.match(sectionRegex);
            return match ? match[1].trim() : '';
        };

        const bulletPoints = parseSection('KEY FUNCTIONS', responseContent)
            .split('\n')
            .filter(line => line.trim() !== '' && line.startsWith('-'));
        
        const detailedEssay = parseSection('DETAILED EXPLANATION', responseContent);
        const navigationGuide = parseSection('FULL CODE', responseContent);

        res.json({
            bulletPoints,
            detailedEssay,
            navigationGuide
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});