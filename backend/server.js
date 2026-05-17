const express = require('express');
const cors = require('cors');
const modulesRouter     = require('./routes/modules');
const generateRouter    = require('./routes/generate');
const exportRouter      = require('./routes/export');
const apkRouter         = require('./routes/apk');
const challengesRouter  = require('./routes/challenges');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/modules',     modulesRouter);
app.use('/api/generate',    generateRouter);
app.use('/api/export',      exportRouter);
app.use('/api/apk',         apkRouter);
app.use('/api/challenges',  challengesRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
