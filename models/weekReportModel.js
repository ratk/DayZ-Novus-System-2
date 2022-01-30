let mongoose = require('mongoose');

let weekReportSchema = mongoose.Schema({
  serverID: String,
  report: {
    weekNumber: Number,
    highestPlayers: Number,
    averagePlayers: Number,
    averageHighestPlayers: Number
  }
});

module.exports = mongoose.model('weekReport', weekReportSchema);