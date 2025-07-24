const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.use('/api/auth', authRoutes);
const teamRoutes = require('./routes/team');
app.use('/api/team', teamRoutes);

const transferRoutes = require('./routes/transfer');
app.use('/api/transfer', transferRoutes);
const PORT = process.env.PORT || 5000;


const marketRoutes = require('./routes/market');
app.use('/api/market', marketRoutes);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
