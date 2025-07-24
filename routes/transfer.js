const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Player = require('../models/Player');
const User = require('../models/User');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid token' });
  }
};

// Add player to transfer list
router.post('/add', authMiddleware, async (req, res) => {
  const { playerId, askingPrice } = req.body;

  try {
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ msg: 'Player not found' });

    player.onTransferList = true;
    player.askingPrice = askingPrice;
    await player.save();

    res.json({ msg: 'Player added to transfer list', player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Remove player from transfer list
router.post('/remove', authMiddleware, async (req, res) => {
  const { playerId } = req.body;

  try {
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ msg: 'Player not found' });

    player.onTransferList = false;
    player.askingPrice = null;
    await player.save();

    res.json({ msg: 'Player removed from transfer list', player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});
const Team = require('../models/Team');

router.get('/market', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    const myTeam = await Team.findById(user.teamId);

    const players = await Player.find({
      onTransferList: true,
      teamId: { $ne: myTeam._id },
    }).populate('teamId');

    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});
router.post('/buy', authMiddleware, async (req, res) => {
    const { playerId } = req.body;
  
    try {
      const user = await User.findById(req.user).populate('teamId');
      const buyerTeam = await Team.findById(user.teamId);
  
      const player = await Player.findById(playerId);
      if (!player || !player.onTransferList) {
        return res.status(400).json({ msg: 'Player not available' });
      }
  
      const sellerTeam = await Team.findById(player.teamId);
  
      const price = player.askingPrice * 0.95;
  
      if (buyerTeam.budget < price) {
        return res.status(400).json({ msg: 'Not enough budget' });
      }
  
      const buyerCount = await Player.countDocuments({ teamId: buyerTeam._id });
      if (buyerCount >= 25) {
        return res.status(400).json({ msg: 'Cannot exceed 25 players' });
      }
  
      const sellerCount = await Player.countDocuments({ teamId: sellerTeam._id });
      if (sellerCount <= 15) {
        return res.status(400).json({ msg: 'Seller must keep at least 15 players' });
      }
  
      // Transfer ownership
      player.teamId = buyerTeam._id;
      player.onTransferList = false;
      player.askingPrice = null;
      await player.save();
  
      // Update budgets
      buyerTeam.budget -= price;
      sellerTeam.budget += price;
  
      await buyerTeam.save();
      await sellerTeam.save();
  
      res.json({ msg: 'Player purchased!', player });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });
  
module.exports = router;
