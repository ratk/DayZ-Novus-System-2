let mongoose = require('mongoose');

let dayReportSchema = mongoose.Schema({
  serverID: String,
  report: {
    date: Date,
    highestPlayers: Number,
    averagePlayers: Number
  }
});

module.exports = mongoose.model('dayReport', dayReportSchema);