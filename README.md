# AI Cold Caller

An automated cold calling system that uses Twilio for voice calls and ElevenLabs for AI-powered conversations. This application reads phone numbers from a CSV file and automatically places calls with AI agents handling the conversations.

## 🚀 Features

- **Automated Batch Calling**: Reads phone numbers from CSV and calls them sequentially
- **AI-Powered Conversations**: Uses ElevenLabs Realtime API for natural conversations
- **Twilio Integration**: Leverages Twilio Voice API for call management
- **Real-time Audio Streaming**: Bi-directional audio streaming between Twilio and ElevenLabs
- **Call Logging**: Tracks all call statuses in `call-log.txt`
- **Configurable AI Agent**: Customize the AI's personality and script via `config/agentPrompt.txt`
- **Production Ready**: Clean, commented code with error handling

## 📋 Prerequisites

- Node.js 18+ (with ES modules support)
- Twilio account with Voice API access
- ElevenLabs account with Realtime API access
- Valid phone number for outbound calls

## 🛠️ Installation

1. **Clone or download the project**
   ```bash
   cd neuro-web-cold-calling-agent3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `env.example` to `.env`
   - Fill in your Twilio and ElevenLabs credentials:
   ```env
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
   BASE_URL=http://localhost:3000
   ```

4. **Configure your leads**
   - Edit `leads.csv` with your target phone numbers
   - Ensure the CSV has a `phone` column with valid phone numbers

5. **Customize the AI agent** (optional)
   - Edit `config/agentPrompt.txt` to change the AI's personality and script

## 🎯 Usage

1. **Start the server**
   ```bash
   npm start
   ```

2. **Begin calling leads**
   ```bash
   curl -X POST http://localhost:3000/start
   ```
   
   Or use any HTTP client to POST to `http://localhost:3000/start`

3. **Monitor call logs**
   - Check `call-log.txt` for detailed call status
   - Watch the console for real-time updates

## 📁 Project Structure

```
neuro-web-cold-calling-agent3/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── env.example            # Environment variables template
├── leads.csv              # Phone numbers to call
├── call-log.txt           # Call status log (created automatically)
├── config/
│   └── agentPrompt.txt    # AI agent personality and script
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | Yes |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | Yes |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number | Yes |
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key | Yes |
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID to use | Yes |
| `BASE_URL` | Your server's public URL | Yes |
| `PORT` | Server port (default: 3000) | No |
| `CALL_DELAY_MS` | Delay between calls in ms (default: 5000) | No |

### CSV Format

Your `leads.csv` file should have at least a `phone` column:

```csv
phone,name,company
+1234567890,John Smith,ABC Corp
+1987654321,Jane Doe,XYZ Inc
```

### AI Agent Customization

Edit `config/agentPrompt.txt` to customize:
- The AI's personality and tone
- Conversation flow and talking points
- Key messages and value propositions
- How to handle objections or rejections

## 🔌 API Endpoints

### POST `/start`
Initiates calling all leads from the CSV file.

**Response:**
```json
{
  "message": "Started calling 5 leads",
  "leads": 5,
  "status": "completed"
}
```

### POST `/outbound`
Twilio webhook endpoint that returns TwiML for call handling.

## 🔄 How It Works

1. **Call Initiation**: Server reads phone numbers from `leads.csv`
2. **Twilio Call**: Places call using Twilio Voice API
3. **TwiML Response**: Returns TwiML with `<Connect><Stream>` to establish WebSocket
4. **Audio Streaming**: 
   - Twilio audio → Server → ElevenLabs
   - ElevenLabs audio → Server → Twilio
5. **AI Conversation**: ElevenLabs handles the conversation using your configured prompt
6. **Logging**: All call events are logged to `call-log.txt`

## 📊 Call Logging

All calls are logged to `call-log.txt` with timestamps:

```
[2024-01-15T10:30:00.000Z] +1234567890 - started
[2024-01-15T10:32:15.000Z] +1234567890 - completed
[2024-01-15T10:35:00.000Z] +1987654321 - failed - Invalid phone number
```

## ⚠️ Important Notes

- **Compliance**: Ensure you comply with local telemarketing laws and regulations
- **Rate Limiting**: The system includes delays between calls to avoid overwhelming systems
- **WebSocket URLs**: Make sure your `BASE_URL` is publicly accessible for Twilio webhooks
- **Testing**: Test with a small number of leads first
- **Monitoring**: Monitor call logs and server logs for any issues

## 🐛 Troubleshooting

### Common Issues

1. **"leads.csv file not found"**
   - Ensure `leads.csv` exists in the project root
   - Check file permissions

2. **"No valid phone numbers found"**
   - Verify CSV has a `phone` column
   - Check phone number format (include country code)

3. **Twilio authentication errors**
   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
   - Check Twilio account status

4. **ElevenLabs connection errors**
   - Verify `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`
   - Check ElevenLabs account limits

5. **WebSocket connection issues**
   - Ensure `BASE_URL` is publicly accessible
   - Check firewall settings

## 📝 License

MIT License - feel free to modify and use for your projects.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
"# NeuroWeb-Cold-Calling-Agent3" 
"# NeuroWeb-Cold-Calling-Agent3" 
