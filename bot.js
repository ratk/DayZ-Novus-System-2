const childProcess = require('child_process');
const Discord = require('discord.js');
const client = new Discord.Client({disableEveryone: false, intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]});
const dotenv = require('dotenv');
const fs = require('fs');
const dayReport = require('./models/dayReportModel');
const weekReport = require('./models/weekReportModel');
const mongoose = require('mongoose');
const {MongoClient} = require('mongodb');
dotenv.config();

// Connect to MongoDB database.
mongoose.connect(process.env.mongoURI);

let db, dbo;

// Files
const configFile = './config.json'
const playerFile = './output/players.json';

let config = require(configFile);
let whitelist = config.whitelist;
let boundaries = config.boundaries;
let n = config.runtime; // Amount of hours to run radar

const minute = 60000; // 1 minute in milliseconds
const hour = 12; // 1 hour in 5 minute increments
let tick = 0;

let reportToday = new dayReport();
reportToday.serverID = process.env.server_id
reportToday.report.date = new Date();
reportToday.report.highestPlayers = 0;
reportToday.report.averagePlayers = 0;

let reportWeek = new weekReport();
reportWeek.serverID = process.env.server_id
reportWeek.report.highestPlayers = 0;
reportWeek.report.averagePlayers = 0;
reportWeek.report.averageHighestPlayers = 0;

// Config variables manipulation
const refreshConfig = async function() {delete require.cache[require.resolve(configFile)];config=require(configFile);whitelist=config.whitelist;n=config.runtime;boundaries=config.boundaries;};
const updateConfig = async function() {fs.writeFileSync(configFile,JSON.stringify(config,null,2));refreshConfig();};

// Get latest players from json
const getLatestPlayers = async function() {let p=require(playerFile);delete require.cache[require.resolve(playerFile)];p=require(playerFile);return p;};

const getGamertag = async function(t){let n="";if(1<t.length)for(let e=0;e<t.length;e++)e+1==t.length?n+=t[e]:n=n+t[e]+" ";else n=t[0];return n};
const calculateTime = async function() {let r=Math.floor((hour*n-tick)/hour);let m=((hour*n-tick)%hour)*5;return{r,m};}

// Get latest logs
async function updateLogs(message, doReturn) {
	let spawn = childProcess.spawnSync('python', ['collect.py']);
	let error = spawn.stderr.toString().trim();
	if (error&&doReturn) return message.channel.send(`Error: ${error}`);
	if (error) return [true, error];
	if (doReturn) return message.channel.send(`Updated Logs`);
	return [false, null];
}

async function check(message) {
	let errors = await updateLogs(null, false);
	if (errors[0]) return message.channel.send(errors[1]);
  // Check Data
	let players = await getLatestPlayers();
	players = players.players;
	let px, py;
	for (let i = 0; i < players.length; i++) {
		px = players[i].pos[0];
		py = players[i].pos[1];
		// Inside Bounderies
		if (px>boundaries.x1&&px<boundaries.x2&&py<boundaries.y1&&py>boundaries.y2) {
			if (!whitelist.includes(players[i].gamertag)) {
				tick = hour*n;
				tick++;
				return message.channel.send(`@here \`${players[i].gamertag}\` is in the bourndaries!`);
			}
		}
	}
}

function startSystem(message) {
	check(message);
  tick++;
  setTimeout(function() {
  	// Runs for 'n' hours
    if (tick <= hour*n) {
      startSystem(message);
    } else {tick=0;return message.channel.send("System Alarm Disabled");}
  }, minute*5); // 5 minutes
}

async function forceCheck(message) {
	let errors = await updateLogs(null, false);
	if (errors[0]) return message.channel.send(errors[1]);
	message.channel.send("Checking...")
 	let players = await getLatestPlayers();
	players = players.players;
 	let px, py;
 	for (let i = 0; i < players.length; i++) {
 		px = players[i].pos[0]
		py = players[i].pos[1]
		// Inside Bounderies
		if (px>boundaries.x1&&px<boundaries.x2&&py<boundaries.y1&&py>boundaries.y2) {
			if (!whitelist.includes(players[i].gamertag)) {
				return message.channel.send(`@here \`${players[i].gamertag}\` is in the bourndaries!`);
			}
		}
	}
	return message.channel.send('None');
}

async function calculateVector(pos, lastPos) {
	let diff = [Math.round(lastPos[0] - pos[0]), Math.round(lastPos[1] - pos[1])];
	let distance = Math.sqrt(Math.pow(diff[0], 2) + Math.pow(diff[1], 2)).toFixed(0)
	let theta = Math.abs(Math.atan(diff[1]/diff[0])*180/Math.PI).toFixed(0);
	let dir;

	if (pos[0]>lastPos[0]&&pos[1]>lastPos[1]) dir = "North East";
	if (pos[0]>lastPos[0]&&pos[1]<lastPos[1]) dir = "South East";
	if (pos[0]==lastPos[0]&&pos[1]>lastPos[1]) dir = "North";
	if (pos[0]==lastPos[0]&&pos[1]<lastPos[1]) dir = "South";
	if (pos[0]<lastPos[0]&&pos[1]>lastPos[1]) dir = "North West";
	if (pos[0]<lastPos[0]&&pos[1]<lastPos[1]) dir = "South West";
	if (pos[0]>lastPos[0]&&pos[1]==lastPos[1]) dir = "East";
	if (pos[0]<lastPos[0]&&pos[1]==lastPos[1]) dir = "West";

	return {distance, theta, dir}
}

async function playerList(message) {
	let errors = await updateLogs(null, false);
	if (errors[0]) return message.channel.send(errors[1]);
	let players = await getLatestPlayers();
	players = players.players;

	let online = new Discord.MessageEmbed()
  	.setColor('#ed3e24')
  	.setTitle('**__Online Players:__**')
  	.setAuthor('Novus', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')

  let offline = new Discord.MessageEmbed()
  	.setColor('#ed3e24')
  	.setTitle('**__Offlines Players__**')
  	.setAuthor('Novus', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')

  if (players.length==0) return message.channel.send("No players in logs");
	for (let i = 0; i < players.length; i++) {
		if (players[i].connectionStatus=="Online") {
			online.addFields({ name: `**${players[i].gamertag}** is:`, value: `\`${players[i].connectionStatus}\``, inline: false });
		} else {
			offline.addFields({ name: `**${players[i].gamertag}** is:`, value: `\`${players[i].connectionStatus}\``, inline: false });
		}
	}
	message.channel.send(offline);
	return message.channel.send(online);
}

async function currentPos(message, args) {
	if (args.length==0) return message.channel.send(`You need to provide a gamertag`);
	let errors = await updateLogs(null, false);
	if (errors[0]) return message.channel.send(errors[1]);
  let players = await getLatestPlayers();
	players = players.players;
	let gamertag = await getGamertag(args);
	let pos, lastPos;
	for (let i = 0; i < players.length; i++) {
		if (players[i].gamertag==gamertag) {
			if (players[i].time==null) return message.channel.send(`Player \`${gamertag}\` has no position data.`);
			pos = players[i].pos;
			message.channel.send("Calculating...")
			if (players[i].posHistory.length>0) {
				lastPos = players[i].posHistory[players[i].posHistory.length-1].pos
				let {distance, theta, dir} = await calculateVector(pos, lastPos);

				message.channel.send(`**__${gamertag}'s current positional data:__**`)
				message.channel.send(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`);
				message.channel.send(`**From Last Position:** \`${lastPos[0]} / ${lastPos[1]}\`  at  **Last Time:** \`${players[i].posHistory[players[i].posHistory.length-1].time}\``);
				return message.channel.send(`**To Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players[i].time}\``);
			}
			message.channel.send(`**__${gamertag}'s current positional data:__**`)
			return message.channel.send(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players[i].time}\``);	
		}
	}
	return message.channel.send(`Player \`${gamertag}\` not found`);
}

async function checkPosHistory(message, args) {
	if (args.length==0) return message.channel.send(`You need to provide a gamertag`);
	let errors = await updateLogs(null, false);
	if (errors[0]) return message.channel.send(errors[1]);
  let players = await getLatestPlayers();
	players = players.players;
	let gamertag = await getGamertag(args);
	let pos, lastPos;
	let playerHistory;
	for (let i = 0; i < players.length; i++) {
		if (players[i].gamertag==gamertag) {
			if (players[i].time==null) return message.channel.send(`Player \`${gamertag}\` has no position data.`);
			playerHistory = [];
			message.channel.send(`**__${gamertag}'s positional history:__**`)
			message.channel.send(`**Latest Positions:** \`${players[i].pos[0]} / ${players[i].pos[1]}\`  at  **Latest Time:** \`${players[i].time}\``);	
			message.channel.send(`Collecting Position History...`);
			for (let j = 0; j < players[i].posHistory.length; j++) {
				playerHistory.push(`**Position:** \`${players[i].posHistory[j].pos[0]} / ${players[i].posHistory[j].pos[1]}\`  at  **Time:** \`${players[i].posHistory[j].time}\``);	
			}
			message.channel.send(playerHistory);
			message.channel.send("Calculating...");
			pos = players[i].pos;
			if (players[i].posHistory.length>0) {
				lastPos = players[i].posHistory[players[i].posHistory.length-1].pos
				let {distance, theta, dir} = await calculateVector(pos, lastPos);
			
				message.channel.send(`**__${gamertag}'s current positional data:__**`);
				message.channel.send(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`);
				message.channel.send(`**From Last Position:** \`${lastPos[0]} / ${lastPos[1]}\`  at  **Last Time:** \`${players[i].posHistory[players[i].posHistory.length-1].time}\``);
				message.channel.send(`**To Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players[i].time}\``);
				return message.channel.send("Done");
			}
			message.channel.send(`**__${gamertag}'s current positional data:__**`)
			message.channel.send(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players[i].time}\``);	
			return message.channel.send("Done");
		}
	}
	return message.channel.send(`Player \`${gamertag}\` not found`);
}

async function onlineStatus(message, args) {
	if (args.length==0) return message.channel.send(`You need to provide a gamertag`);
	let errors = await updateLogs(null, false);
	if (errors[0]) return message.channel.send(errors[1]);
  let players = await getLatestPlayers();
	players = players.players;
	let gamertag = await getGamertag(args);
	for (let i = 0; i < players.length; i++) {
		if (players[i].gamertag==gamertag) {
			return message.channel.send(`Player \`${gamertag}\` is \`${players[i].connectionStatus}\``);
		}
	}
	return message.channel.send(`Player \`${gamertag}\` not found`);
}

async function restartServer(message) {
	let spawn = childProcess.spawnSync('python', ['restart.py']);
	let error = spawn.stderr.toString().trim();
	if (error) return message.channel.send(`Error: ${error}`);
	return message.channel.send("Restarting Server...");
}

async function updateRadar(message, args) {
	if (args.length==0) return message.channel.send(`You need to provide an \` x1 \` \` y1 \` \` x2 \` \` y2 \``);
	if (args.length>0&&args.length<4) return message.channel.send(`You're missing coordinates D:`);
	config.boundaries.x1 = args[0];
	config.boundaries.y1 = args[1];
	config.boundaries.x2 = args[2];
	config.boundaries.y2 = args[3];
	await updateConfig();
	return message.channel.send(`Boundaries are now between \` [${args[0]} / ${args[1]}] \` / \` [${args[2]} / ${args[3]}] \``);
}

async function addWhitelist(message, args) {
	if (args.length==0) return message.channel.send(`You need to provide an gamertag`);
	let gamertag = getGamertag(args);
	config.whitelist.push(gamertag);
	await updateConfig();
	return message.channel.send(`Added \` ${args[0]} \` to radar whitelist`);
}

async function removeWhitelist(message, args) {
	if (args.length==0) return message.channel.send(`You need to provide an gamertag`);
	let gamertag = getGamertag(args);
	if (!whitelist.includes(gamertag)) return message.channel.send(`Player \` ${gamertag} \` is not in the whitelist: use command \` ?whitelistAdd <gamertag> \` to add this players.`);
	config.whitelist = whitelist.filter(e => e !== gamertag);
	await updateConfig();
	return message.channel.send(`Removed \` ${gamertag} \` from radar whitelist`);
}

async function updateRuntime(message, args) {
	if (tick>0) return message.channel.send('Cannot update runtime while alarm is active.');
	if (args.length==0) return message.channel.send(`You need to provide a runtime number in hours`);
	if (parseInt(args[0])>24) return message.channel.send('The runtime for the alarm can not be longer than 24 hours');
	config.runtime = parseInt(args[0]);
	await updateConfig();
	return message.channel.send(`Alarm runtime is now set to \`${args[0]}h\``);
}

/*
	Reason this is an async function is I
	plan to use it in the future to collect
	data as a background process.
*/
async function getPlayerCount() {
	let errors = await updateLogs(null, false);
	if (errors[0]) return null;
	let players = await getLatestPlayers();
	players = players.players;
	let onlineCount = 0;
	for (let i = 0; i < players.length; i++) if (players[i].connectionStatus=="Online") onlineCount++;
	return onlineCount;
}

async function connectMongo() {
	db = await MongoClient.connect(process.env.mongoURI,{useUnifiedTopology:true});
	dbo = db.db('novusData');
}

async function collectData(message) {
	let count = await getPlayerCount();
  tick++;
  setTimeout(function() {
    if (tick <= 24) {
    	if (count>reportToday.report.highestPlayers) reportToday.report.highestPlayers = count;
    	reportToday.report.averagePlayers += count;
    	collectData(message);
    } else {
    	reportToday.report.averagePlayers /= 24;
    	reportToday.save(function (err) {
				if (err) console.error(err);
			});

    	let report = new Discord.MessageEmbed()
  			.setColor('#ed3e24')
  			.setTitle(`**__Todays Report (${reportToday.report.date}):__**`)
  			.setAuthor('Novus', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')
  			.addFields({
  				name: 'Highest Players:', value: reportToday.report.highestPlayers, inline: false
  			}, {
  				name: 'Average Players:', value: reportToday.report.averagePlayers, inline: false
  			});
  		message.channel.send(report);

			tick = 0;
			reportToday = new dayReport();
			reportToday.serverID = process.env.server_id
			reportToday.report.date = new Date();
			reportToday.report.highestPlayers = 0;
			reportToday.report.averagePlayers = 0;

			dayReport.count({}, function(err, num) {
				if (err) return console.error(err);
				if (num>=7) {
					dayReport.find().sort({$natural:-1}).limit(7).then(async (days, err) => {
				  	if (err) return console.error(err);
			  		let totalHighestPlayers = 0;
			  		let averagePlayers = 0;
				  	for (let i = 0; i < days.length; i++) {
				  		if (days[i].report.highestPlayers>reportWeek.report.highestPlayers) reportWeek.report.highestPlayers = days[i].report.highestPlayers;
				  		averagePlayers += days[i].report.averagePlayers;
				  		totalHighestPlayers += days[i].report.highestPlayers;
				  	}
				  	reportWeek.report.averagePlayers = (averagePlayers / 7).toFixed(1);
				  	reportWeek.report.averageHighestPlayers = (totalHighestPlayers / 7).toFixed(1);
				  	reportWeek.save(function (err) {
							if (err) console.error(err);
						});

						report = new Discord.MessageEmbed()
			  			.setColor('#ed3e24')
			  			.setTitle(`**__This Weeks Report:__**`)
			  			.setAuthor('Novus', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')
			  			.addFields({
			  				name: 'Highest Players This Week:', value: reportWeek.report.highestPlayers, inline: false
			  			}, {
			  				name: 'Average Players This Week:', value: reportWeek.report.averagePlayers, inline: false
			  			}, {
			  				name: 'Average Highest Players This Week:', value: reportWeek.report.averageHighestPlayers, inline: false
			  			});
			  		message.channel.send(report);

			  		await dbo.collection('dayreports').deleteMany({});
				  });
				};
			});

			collectData(message);
    }
  }, minute*60); // 1 hour
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  connectMongo();
});

// Basic Commands
client.on('message', async (message) => {
  let prefix = "?";
 	if (process.env.DEBUG=="true") prefix = "dev?";
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  // Help Embed
  const help = new Discord.MessageEmbed()
    .setColor('#ed3e24')
    .setTitle('**Commands:**')
    .setAuthor('Novus', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')
    .setDescription('Novus Security Commmand')
    .addFields({
      name: `**__General Commands:__**`,
      value: `
      **${prefix}shortcuts** - \`View supported command shortcuts\`
      **${prefix}help** - \`Displays this help page\`
      **${prefix}ping** - \`Responds with Pong to check Bot responce\`
			**${prefix}restartServer** - \`Restarts Server\`
    	**${prefix}runtime** - \`Returns the max runtime for the alarm radar\`
      **${prefix}playerList** - \`Shows current players\`
      **${prefix}playerCount** - \`Shows number of players in server\`
      `,
      inline: false
    }, {
    	name: `**__Tracking Commands:__**`,
      value: `
      **${prefix}onlineStatus** <gamertag> - \`Check if player is online\`
      **${prefix}playerHistory** <gamertag> - \`Check specific player history\`
      **${prefix}currentPos** <gamertag> - \`Forces a check for player in base\`
    	**${prefix}forceCheck** - \`Forces a check for player in base\`
      `,
      inline: false
    }, {
    	name: `**__Alarm Radar Commands:__**`,
    	value: `
      **${prefix}start** - \`Starts alarm system\`
      **${prefix}stop** - \`Stops alarm system\`
      **${prefix}restart** - \`Restarts alarm system\`\
    	**${prefix}forceCheck** - \`Forces a check for player in base\`
    	**${prefix}isActive** - \`Returns if alarm is active\`
    	**${prefix}updateRadar** <x1, y1, x2, y2> - \`Changes the boundaries for the alarm radar\`
    	**${prefix}addWhitelist** <gamertag> - \`Adds player to whitelist for the alarm radar\`
    	**${prefix}removeWhitelist** <gamertag> - \`Removes player to whitelist for the alarm radar\`
    	**${prefix}updateRuntime** <hours> - \`Updates Max runtime (no more than 24h)\`
    	**${prefix}runtime** - \`Returns the max runtime for the alarm radar\`
    	`
    })

  const shortcuts = new Discord.MessageEmbed()
    .setColor('#ed3e24')
    .setTitle('**Command Shortcuts:**')
    .setAuthor('Novus', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')
    .setDescription('Novus Security Commmand')
    .addFields({
      name: `**__Command Shortcuts:__**`,
      value: `
      **${prefix}playerList** - \`?pl\`
      **${prefix}playerHistory** - \`?history\` or \`?ph\`
      **${prefix}currentPos** - \`?pos\`
      **${prefix}onlineStatus** - \`?online\`
			**${prefix}restartServer** - \`?rsServer\`
      **${prefix}restart** - \`?rsAlarm\`
    	**${prefix}forceCheck** - \`?check\`
    	**${prefix}isActive** - \`?active\` or \`?timer\` or \`?time\`
    	**${prefix}updateRadar** - \`?updateRd\`
    	**${prefix}addWhitelist** - \`?wlAdd\`
    	**${prefix}removeWhitelist** - \`?wlRemove\`
    	**${prefix}updateRuntime** - \`?updateRt\`
    	**${prefix}runtime** - \`?rt\`
    	**${prefix}playerCount** - \`?count\`
      `,
      inline: false
    })

  // Commands
  if (command == 'stats') {
  	if (tick > 0) return message.channel.send(`Already Collecting Statistics`);
  	message.channel.send(`Starting to collect Server Statistics`);
  	collectData(message);
  }
  if (command == 'shortcuts') return message.channel.send(shortcuts);
  if (command == 'ping') return message.channel.send('Pong!');
  if (command == 'help') return message.channel.send(help);
  if (command == 'playerlist' || command == 'pl') playerList(message);
  if (command == 'playerhistory' || command == 'history' || command == 'ph') checkPosHistory(message, args);
  if (command == 'currentpos' || command == 'pos') currentPos(message, args);
  if (command == 'updatelogs' || command == 'update') updateLogs(message, true);
  if (command == 'onlinestatus' || command == 'online') onlineStatus(message, args);
  if (command == 'restartserver' || command == 'rsserver') restartServer(message);
  // if (command == 'forcecheck' || command == 'check') forceCheck(message);
  if (command == 'forcecheck' || command == 'check') return message.channel.send(`Alarm Radar is disabled.`);
  // if (command == 'updateradar' || command == 'updaterd') updateRadar(message, args);
  if (command == 'updateradar' || command =='update') return message.channel.send(`Alarm Radar is disabled.`);
  // if (command == 'whitelistadd' || command == 'wladd') addWhitelist(message, args);
  // if (command == 'whitelistremove' || command == 'wlremove') removeWhitelist(message, args); 
  // if (command == 'updateruntime' || command == 'updatert') updateRuntime(message, args);
  // if (command == 'runtime' || command == 'rt') return message.channel.send(`The current runtime for the base alarm is \` ${n}h \``);
  if (command == 'playercount' || command == 'count') return message.channel.send(`${await getPlayerCount()}/32 players online`);

  // if (command == 'isactive' || command == 'active' || command == 'time' || command == 'timer') {
  // 	if (tick > 0) {
  // 		message.channel.send(`The alarm is active, and will be active for \`${calculateTime().r}h ${calculateTime().m}m\`...`)
  // 		return message.channel.send("use \`?restart\` to restart the alarm.");
  // 	}
  // 	return message.channel.send("System Alarm is not active, use \`?start\` to start the alarm.");	
  // }
  // if (command == 'start') {
  // 	if (tick>0) return message.channel.send("System Alarm is already active, use \`?restart\` to restart the alarm.");	
  // 	tick = 0;
  // 	message.channel.send("System Alarm Started");
  // 	startSystem(message);
  // }

  // // Update 'tick' to 'n' hours will force 'startSystem' func stop itself
  // if (command == 'stop') {
  // 	if (tick==0) return message.channel.send('The system is not active');
  // 	tick=hour*n;tick++;
  // 	return message.channel.send('Stopping... This may take a couple minutes');
  // }

  // // Update 'tick' back to 0 making 'startSystem' func 'restart'
  // if (command == 'restart' || command == 'rsalarm') {
  // 	if (tick==0) return message.channel.send("System Alarm is not active, use \`?start\` to start the alarm.");
  // 	tick=0;
  // 	return message.channel.send('Restarting alarm system...');
  // }

  if (command == 'isactive' ||
  	  command == 'active' ||
  	  command == 'time' ||
  	  command == 'timer' ||
  	  command == 'start' ||
  	  command == 'stop' ||
  	  command == 'restart' ||
  	  command == 'rsalarm'
  	  ) {
  	return message.channel.send(`Alarm Radar is disabled.`);
  }
});
client.login(process.env.token);