# Deployment Guide

This guide covers deploying the AI Cold Caller to production environments.

## 🚀 Quick Deploy Options

### Option 1: Railway
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Option 2: Heroku
1. Create a new Heroku app
2. Set environment variables: `heroku config:set KEY=value`
3. Deploy: `git push heroku main`

### Option 3: DigitalOcean App Platform
1. Create a new app from GitHub
2. Configure environment variables
3. Deploy automatically

## 🔧 Production Configuration

### Required Environment Variables
```env
TWILIO_ACCOUNT_SID=your_production_twilio_sid
TWILIO_AUTH_TOKEN=your_production_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
ELEVENLABS_API_KEY=your_production_elevenlabs_key
ELEVENLABS_VOICE_ID=your_voice_id
BASE_URL=https://your-domain.com
PORT=3000
CALL_DELAY_MS=5000
```

### Important Notes
- **BASE_URL**: Must be publicly accessible HTTPS URL
- **Twilio Webhooks**: Configure in Twilio console to point to your domain
- **SSL Certificate**: Required for WebSocket connections
- **Rate Limiting**: Consider implementing rate limiting for production

## 📊 Monitoring

### Health Check Endpoint
Add this to your server.js for monitoring:

```javascript
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        activeCalls: activeCalls.size,
        activeWebSockets: activeWebSockets.size
    });
});
```

### Logging
- Monitor `call-log.txt` for call statuses
- Set up log aggregation (e.g., LogRocket, DataDog)
- Monitor server logs for errors

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Rotate keys regularly
3. **Rate Limiting**: Implement to prevent abuse
4. **Input Validation**: Validate phone numbers and CSV data
5. **HTTPS Only**: Use SSL/TLS in production

## 📈 Scaling

### Horizontal Scaling
- Use load balancer for multiple instances
- Implement Redis for shared state
- Use external WebSocket service (e.g., Pusher)

### Vertical Scaling
- Increase server resources
- Optimize WebSocket connections
- Implement connection pooling

## 🐛 Troubleshooting Production Issues

### Common Issues
1. **WebSocket Connection Failures**
   - Check SSL certificate
   - Verify firewall settings
   - Monitor network connectivity

2. **Call Failures**
   - Check Twilio account status
   - Verify phone number format
   - Monitor Twilio API limits

3. **ElevenLabs Errors**
   - Check API key validity
   - Monitor usage limits
   - Verify voice ID exists

### Debug Commands
```bash
# Check server health
curl https://your-domain.com/health

# Test webhook endpoint
curl -X POST https://your-domain.com/outbound

# Monitor logs
tail -f call-log.txt
```

## 📞 Support

For production issues:
1. Check server logs
2. Monitor call-log.txt
3. Verify environment variables
4. Test with small batch first
5. Contact Twilio/ElevenLabs support if needed
