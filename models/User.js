const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  hasTeam: { type: Boolean, default: false },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
});

module.exports = mongoose.model('User', UserSchema);
