const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const Team = require('../models/Team');
const Player = require('../models/Player');
const User = require('../models/User');

// Simple auth middleware (reuse your existing one if you have it)
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};

// BUY route
router.post('/buy/:playerId', authMiddleware, async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const buyerUser = await User.findById(req.userId);
    const buyerTeam = await Team.findOne({ userId: buyerUser._id });

    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ msg: 'Player not found' });
    if (!player.onTransferList) return res.status(400).json({ msg: 'Player is not for sale' });

    const sellerTeam = await Team.findById(player.teamId);
    if (!sellerTeam) return res.status(404).json({ msg: 'Seller team not found' });

    if (String(sellerTeam._id) === String(buyerTeam._id)) {
      return res.status(400).json({ msg: 'You cannot buy your own player' });
    }

    // Check player count constraints
    if (buyerTeam.players.length >= 25) return res.status(400).json({ msg: 'Your team is full (max 25)' });
    if (sellerTeam.players.length <= 15) return res.status(400).json({ msg: 'Seller must keep at least 15 players' });

    // Buy at 95% of asking price
    const price = Math.floor(player.askingPrice * 0.95);

    if (buyerTeam.budget < price) {
      return res.status(400).json({ msg: 'Not enough budget' });
    }

    // Transfer: update player teamId
    player.teamId = buyerTeam._id;
    player.onTransferList = false;
    player.askingPrice = undefined;
    await player.save();

    //  Update teams
    buyerTeam.players.push(player._id);
    sellerTeam.players = sellerTeam.players.filter(p => String(p) !== String(player._id));

    buyerTeam.budget -= price;
    sellerTeam.budget += price;

    await buyerTeam.save();
    await sellerTeam.save();

    res.json({ msg: `Player bought for $${price}`, player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
      const buyerUser = await User.findById(req.userId);
      const buyerTeam = await Team.findOne({ userId: buyerUser._id });
  
      const { name, teamName, minPrice, maxPrice } = req.query;
  
      // Base: only players on market, not your own
      const query = {
        onTransferList: true,
        teamId: { $ne: buyerTeam._id },
      };
  
      // Filter by player name
      if (name) {
        query.name = new RegExp(name, 'i'); // case-insensitive match
      }
  
      // Filter by price range
      if (minPrice || maxPrice) {
        query.askingPrice = {};
        if (minPrice) query.askingPrice.$gte = Number(minPrice);
        if (maxPrice) query.askingPrice.$lte = Number(maxPrice);
      }
  
      let players = await Player.find(query).populate('teamId');
  
      // Filter by team name (after populate)
      if (teamName) {
        players = players.filter(p =>
          p.teamId && p.teamId.name && p.teamId.name.toLowerCase().includes(teamName.toLowerCase())
        );
      }
  
      res.json(players);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });
  

module.exports = router;
