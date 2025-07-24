const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  budget: { type: Number, default: 5000000 },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
});

module.exports = mongoose.model('Team', TeamSchema);
