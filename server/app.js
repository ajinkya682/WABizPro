const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/contacts', require('./routes/contact.routes'));
app.use('/api/campaigns', require('./routes/campaign.routes'));
app.use('/api/templates', require('./routes/template.routes'));
app.use('/api/segments', require('./routes/segment.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/inbox', require('./routes/inbox.routes'));
app.use('/api/chatbots', require('./routes/chatbot.routes'));
app.use('/api/billing', require('./routes/billing.routes'));
app.use('/api/business', require('./routes/business.routes'));
app.use('/api/webhook', require('./routes/webhook.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'WABiz Pro API running 🚀' }));
const clientDistPath = path.resolve(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ message: 'Internal server error' }); });

module.exports = app;
