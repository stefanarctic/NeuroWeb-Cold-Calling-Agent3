import express from 'express';
import twilio from 'twilio';
import WebSocket from 'ws';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Store active calls and WebSocket connections
const activeCalls = new Map();
const activeWebSockets = new Map();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * Root route for healthcheck
 */
app.get('/', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'AI Cold Caller',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Log call status to file
 * @param {string} phoneNumber - The phone number being called
 * @param {string} status - Call status (started, completed, failed)
 * @param {string} details - Additional details about the call
 */
function logCallStatus(phoneNumber, status, details = '') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${phoneNumber} - ${status}${details ? ` - ${details}` : ''}\n`;
    
    fs.appendFileSync('call-log.txt', logEntry, 'utf8');
    console.log(`📞 Call Log: ${phoneNumber} - ${status}${details ? ` - ${details}` : ''}`);
}

/**
 * Read agent prompt from config file
 * @returns {string} The agent prompt text
 */
function getAgentPrompt() {
    try {
        return fs.readFileSync(path.join(__dirname, 'config', 'agentPrompt.txt'), 'utf8');
    } catch (error) {
        console.warn('⚠️  Could not read agent prompt file, using default');
        return 'Hello! I am an AI assistant calling on behalf of our company. How can I help you today?';
    }
}

/**
 * Create ElevenLabs WebSocket connection
 * @param {string} callSid - Twilio Call SID
 * @param {string} phoneNumber - Phone number being called
 * @returns {WebSocket} WebSocket connection to ElevenLabs
 */
function createElevenLabsConnection(callSid, phoneNumber) {
    const ws = new WebSocket('wss://api.elevenlabs.io/v1/conv', {
        headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY
        }
    });

    ws.on('open', () => {
        console.log(`🔗 ElevenLabs WebSocket connected for call ${callSid}`);
        
        // Send initialization message
        const initMessage = {
            type: 'conversation_init',
            voice_id: process.env.ELEVENLABS_VOICE_ID,
            agent_prompt: getAgentPrompt(),
            conversation_config: {
                agent: {
                    prompt: {
                        prompt: getAgentPrompt()
                    }
                }
            }
        };
        
        ws.send(JSON.stringify(initMessage));
        activeWebSockets.set(callSid, ws);
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            if (message.type === 'audio') {
                // Forward audio from ElevenLabs to Twilio
                const twilioWs = activeCalls.get(callSid);
                if (twilioWs && twilioWs.readyState === WebSocket.OPEN) {
                    // Convert base64 audio to binary and send to Twilio
                    const audioBuffer = Buffer.from(message.audio, 'base64');
                    twilioWs.send(audioBuffer);
                }
            }
        } catch (error) {
            console.error(`❌ Error processing ElevenLabs message for call ${callSid}:`, error);
        }
    });

    ws.on('close', () => {
        console.log(`🔌 ElevenLabs WebSocket closed for call ${callSid}`);
        activeWebSockets.delete(callSid);
    });

    ws.on('error', (error) => {
        console.error(`❌ ElevenLabs WebSocket error for call ${callSid}:`, error);
        logCallStatus(phoneNumber, 'failed', `ElevenLabs WebSocket error: ${error.message}`);
    });

    return ws;
}

/**
 * Handle Twilio WebSocket connection for audio streaming
 * @param {string} callSid - Twilio Call SID
 * @param {string} phoneNumber - Phone number being called
 */
function handleTwilioWebSocket(callSid, phoneNumber) {
    // This will be called when Twilio connects to our WebSocket endpoint
    // The actual WebSocket handling is done in the /outbound route
    console.log(`📞 Twilio WebSocket connection established for call ${callSid}`);
}

/**
 * Route to handle outbound calls and establish TwiML stream
 */
app.post('/outbound', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Create a stream to handle real-time audio
    const stream = twiml.connect().stream({
        url: `wss://${req.get('host')}/stream`
    });
    
    res.type('text/xml');
    res.send(twiml.toString());
});

/**
 * WebSocket endpoint for Twilio audio streaming
 */
app.get('/stream', (req, res) => {
    // This endpoint will be upgraded to WebSocket by Twilio
    // The actual WebSocket handling is done through the upgrade event
});

/**
 * Start calling all leads from CSV file
 */
app.post('/start', async (req, res) => {
    try {
        const leads = [];
        
        // Read CSV file
        if (!fs.existsSync('leads.csv')) {
            return res.status(404).json({ 
                error: 'leads.csv file not found. Please create a CSV file with a "phone" column.' 
            });
        }

        await new Promise((resolve, reject) => {
            fs.createReadStream('leads.csv')
                .pipe(csv())
                .on('data', (row) => {
                    if (row.phone) {
                        leads.push(row.phone.trim());
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        if (leads.length === 0) {
            return res.status(400).json({ 
                error: 'No valid phone numbers found in leads.csv' 
            });
        }

        console.log(`📋 Found ${leads.length} leads to call`);
        
        // Start calling leads sequentially
        for (let i = 0; i < leads.length; i++) {
            const phoneNumber = leads[i];
            
            try {
                console.log(`📞 Calling ${phoneNumber} (${i + 1}/${leads.length})`);
                logCallStatus(phoneNumber, 'started');
                
                const call = await client.calls.create({
                    to: phoneNumber,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    url: `${process.env.BASE_URL}/outbound`
                });
                
                console.log(`✅ Call initiated for ${phoneNumber}, SID: ${call.sid}`);
                
                // Wait before next call
                if (i < leads.length - 1) {
                    const delay = parseInt(process.env.CALL_DELAY_MS) || 5000;
                    console.log(`⏳ Waiting ${delay}ms before next call...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
            } catch (error) {
                console.error(`❌ Failed to call ${phoneNumber}:`, error);
                logCallStatus(phoneNumber, 'failed', error.message);
            }
        }

        res.json({ 
            message: `Started calling ${leads.length} leads`,
            leads: leads.length,
            status: 'completed'
        });

    } catch (error) {
        console.error('❌ Error starting calls:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * WebSocket upgrade handler for Twilio audio streaming
 */
const server = app.listen(port, () => {
    console.log(`🚀 AI Cold Caller server running on port ${port}`);
    console.log(`📞 Twilio webhook URL: ${process.env.BASE_URL}/outbound`);
    console.log(`🎯 Start calling endpoint: POST ${process.env.BASE_URL}/start`);
});

// Handle WebSocket upgrades
server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    
    if (pathname === '/stream') {
        const ws = new WebSocket.Server({ noServer: true });
        
        ws.handleUpgrade(request, socket, head, (ws) => {
            ws.on('message', (data) => {
                try {
                    // Forward audio from Twilio to ElevenLabs
                    const elevenLabsWs = Array.from(activeWebSockets.values())[0];
                    if (elevenLabsWs && elevenLabsWs.readyState === WebSocket.OPEN) {
                        // Convert binary audio to base64 and send to ElevenLabs
                        const audioBase64 = data.toString('base64');
                        elevenLabsWs.send(JSON.stringify({
                            type: 'audio',
                            audio: audioBase64
                        }));
                    }
                } catch (error) {
                    console.error('❌ Error forwarding audio to ElevenLabs:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 Twilio WebSocket connection closed');
            });
            
            ws.on('error', (error) => {
                console.error('❌ Twilio WebSocket error:', error);
            });
        });
    } else {
        socket.destroy();
    }
});

/**
 * Graceful shutdown handler
 */
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down AI Cold Caller...');
    
    // Close all active WebSocket connections
    activeWebSockets.forEach((ws) => {
        ws.close();
    });
    
    activeCalls.forEach((ws) => {
        ws.close();
    });
    
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

export default app;
