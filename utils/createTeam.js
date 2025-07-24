// backend/utils/createTeam.js

const Team = require('../models/Team');
const Player = require('../models/Player');

const positions = {
  Goalkeeper: 3,
  Defender: 6,
  Midfielder: 6,
  Attacker: 5,
};

function randomName() {
  const names = ['Alex', 'Jordan', 'Chris', 'Taylor', 'Morgan', 'Jamie', 'Sam', 'Cameron', 'Casey', 'Riley'];
  return names[Math.floor(Math.random() * names.length)] + ' ' + Math.floor(Math.random() * 100);
}

async function createTeamForUser(user) {
  const team = new Team({
    userId: user._id,
    budget: 5000000,
  });

  await team.save();

  const players = [];

  for (const [position, count] of Object.entries(positions)) {
    for (let i = 0; i < count; i++) {
      players.push(new Player({
        name: randomName(),
        position,
        teamId: team._id,
        price: Math.floor(Math.random() * 1000000) + 50000,
      }));
    }
  }

  const savedPlayers = await Player.insertMany(players);
  team.players = savedPlayers.map(p => p._id);
  await team.save();

  // The important bit: user must be a full Mongoose document
  user.hasTeam = true;
  user.teamId = team._id;
  await user.save();

  return team;
}

module.exports = createTeamForUser;
