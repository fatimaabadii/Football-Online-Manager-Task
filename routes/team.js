const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Team = require('../models/Team');
const Player = require('../models/Player');

const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Expect "Bearer TOKEN"
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
router.get('/', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user);
      if (!user) return res.status(404).json({ msg: 'User not found' });
  
      // FIX: If user has no team, create one immediately
      if (!user.hasTeam) {
        console.log('No team found, creating now...');
        await createTeamForUser(user); // You’ll define this helper
      }
  
      const team = await Team.findById(user.teamId).populate('players');
      if (!team) return res.status(404).json({ msg: 'Team not found' });
  
      res.json(team);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error' });
    }
  });
  



module.exports = router;
