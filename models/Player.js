const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: String,
  position: String,
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  price: Number,
  onTransferList: { type: Boolean, default: false },
  askingPrice: Number,
});

module.exports = mongoose.model('Player', PlayerSchema);
