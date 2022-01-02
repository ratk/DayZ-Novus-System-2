const { exec } = require('child_process');
const Discord = require('discord.js');
const client = new Discord.Client({disableEveryone: false, intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]});
const dotenv = require('dotenv');
dotenv.config();

const minute = 60000; //1 minute in milliseconds
let i = 0;

const log = function(x){if(DEBUG)console.log(x)};

// const whitelist = require('./whitelist.json').players;
let DEBUG = (process.env.DEBUG=="true");
log("Debug mode: ", DEBUG);

const getGamertag = function(t){let n;if(1<t.length)for(let e=0;e<t.length;e++)e+1==t.length?n+=t[e]:n=n+t[e]+" ";else n=t[0];return n};

function check(message) {
  log("\n------------- Begin Check -------------")
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Check -------------");return message.channel.send(error);
    if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Check -------------");return message.channel.send(stderr);
    log("Successfully executed collect.py");
    // Check Data
		let players = require('./players.json');
		for (let i = 0; i < players.players.length; i++) {
			let px = players.players[i].pos[0];
			let py = players.players[i].pos[1];
			// Inside Bounderies
			if (px>2326.84&&px<2995.71&&py<1625.04&&py>1061.15) {
				if (!whitelist.includes(players.players[i].gamertag)) {
					log(`Player ${players.players[i].gamertag} found in base.\n\n------------- End Check -------------`);
					return message.channel.send(`@everyone \`${players.players[i].gamertag}\` is in our base!`);
				}
			}
		}
		log("No players found\n\n------------- End Check -------------");
	});
}

function startSystem(message) {
	check(message);
  i += 1;
  setTimeout(function() {
    if (i <= 48) {
      startSystem(message);
    } else log("\nSystem Alarm Disabled");return message.channel.send("System Alarm Disabled");
  }, minute*5);
}

function forceCheck(message) {
	log("\n------------- Begin Force Check -------------");
	exec("python collect.py", (error, stdout, stderr) => {
  	if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Force Check -------------");return message.channel.send(error);
  	if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Force Check -------------");return message.channel.send(stderr);
    log("Successfully executed collect.py");
    message.channel.send("Checking...")
	 	let players = require('./players.json');
	 	for (let i = 0; i < players.players.length; i++) {
	 		let px = players.players[i].pos[0]
			let py = players.players[i].pos[1]
			// Inside Bounderies
			if (px>2326.84&&px<2995.71&&py<1625.04&&py>1061.15) {
				if (!whitelist.includes(players.players[i].gamertag)) {
					log(`Player ${players.players[i].gamertag} found in base.`);
					return message.channel.send(`@everyone \`${players.players[i].gamertag}\` is in our base!\n\n------------- End Force Check -------------`);
				}
			}
		}
	  log("No players found")
		return message.channel.send('None\n\n------------- End Force Check -------------');
	});
}

function calculateVector(pos, lastPos) {
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

function playerList(message) {
	log("\n------------- Begin Collect Player List -------------");
	exec("python collect.py", (error, stdout, stderr) => {
		if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Collect Player List -------------");return message.channel.send(error);
    if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Collect Player List -------------");return message.channel.send(stderr);
    log("Successfully executed collect.py");
		let players = require('./players.json');
		let onlinePlayers = [];
		let offlinePlayers = [];

		let online = new Discord.MessageEmbed()
    	.setColor('#ed3e24')
    	.setTitle('**__Players:__**')
    	.setAuthor('McDazzzled', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')

		if (players.players.length==0) log("No players in logs");return message.channel.send("No players in logs");
		for (let i = 0; i < players.players.length; i++) {
			if (players.players[i].connectionStatus=="Online") {
				onlinePlayers.push(players.players[i].gamertag);
			} else {
				offlinePlayers.push(players.players[i].gamertag);
			}
			online.addFields({ name: `**${players.players[i].gamertag}** is:`, value: `\`${players.players[i].connectionStatus}\``, inline: false });
		}
		log("Online:",onlinePlayers,"\nOffline:",offlinePlayers,`\n\n------------- End Collect Player List -------------`);
		return message.channel.send(online);
	});
}

function currentPos(message, args) {
	log("\n------------- Begin Current Player Pos -------------")
	if (args.length==0) log("ERROR: No Gamertag provided\n\n------------- End Current Player Pos -------------");return message.channel.send(`You need to provide a gamertag`);
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Current Player Pos -------------");return message.channel.send(error);
    if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Current Player Pos -------------");return message.channel.send(stderr);
    log("Successfully executed collect.py");		
		let players = require('./players.json');
		let gamertag = getGamertag(args);
		for (let i = 0; i < players.players.length; i++) {
			if (players.players[i].gamertag==gamertag) {
				if (players.players[i].time==null) log(`Player \`${gamertag}\` has no position data.`);return message.channel.send(`Player \`${gamertag}\` has no position data.`);
				let pos = players.players[i].pos;
				message.channel.send("Calculating...")
				if (players.players[i].posHistory.length>0) {
					let lastPos = players.players[i].posHistory[players.players[i].posHistory.length-1].pos
					let {distance, theta, dir} = calculateVector(pos, lastPos);
					
					log(`**__${gamertag}'s current positional data:__**`)
					log(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`)
					log(`**From Last Position:** ${lastPos[0]} / ${lastPos[1]}  at  **Last Time:** ${players.players[i].posHistory[players.players[i].posHistory.length-1].time}`)
					log(`**To Latest Position:** ${pos[0]} / ${pos[1]}  at  **Latest Time:** ${players.players[i].time}\n\n------------- End Current Player Pos -------------`)

					message.channel.send(`**__${gamertag}'s current positional data:__**`)
					message.channel.send(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`);
					message.channel.send(`**From Last Position:** \`${lastPos[0]} / ${lastPos[1]}\`  at  **Last Time:** \`${players.players[i].posHistory[players.players[i].posHistory.length-1].time}\``);
					return message.channel.send(`**To Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);
				}
				log(`**__${gamertag}'s current positional data:__**`)
				log(`**Latest Position:** ${pos[0]} / ${pos[1]}  at  **Latest Time:** ${players.players[i].time}\n\n------------- End Current Player Pos -------------`)
				message.channel.send(`**__${gamertag}'s current positional data:__**`)
				return message.channel.send(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);	
			}
		}
		log(`Player \`${gamertag}\` not found\n\n------------- End Current Player Pos -------------`)
		return message.channel.send(`Player \`${gamertag}\` not found`);
	});
}

function checkPosHistory(message, args) {
	log("\n------------- Begin Player Pos History -------------")
	if (args.length==0) log("ERROR: No Gamertag provided\n\n------------- End Player History Pos -------------");return message.channel.send(`You need to provide a gamertag`);
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Player Pos History -------------");return message.channel.send(error);
    if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Player Pos History -------------");return message.channel.send(stderr);
    log("Successfully executed collect.py");	
		let players = require('./players.json');
		let gamertag = getGamertag(args);
		for (let i = 0; i < players.players.length; i++) {
			if (players.players[i].gamertag==gamertag) {
				if (players.players[i].time==null) log(`Player \`${gamertag}\` has no position data.`);return message.channel.send(`Player \`${gamertag}\` has no position data.`);
				log(`**__${gamertag}'s positional history:__**`);
				log(`**Latest Positions:** \`${players.players[i].pos[0]} / ${players.players[i].pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);
				let playerHistory = [];
				message.channel.send(`**__${gamertag}'s positional history:__**`)
				message.channel.send(`**Latest Positions:** \`${players.players[i].pos[0]} / ${players.players[i].pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);	
				message.channel.send(`Collecting Position History...`);
				for (let j = 0; j < players.players[i].posHistory.length; j++) {
					log(`**Position:** ${players.players[i].posHistory[j].pos[0]} / ${players.players[i].posHistory[j].pos[1]}  at  **Time:** ${players.players[i].posHistory[j].time}`);
					playerHistory.push(`**Position:** \`${players.players[i].posHistory[j].pos[0]} / ${players.players[i].posHistory[j].pos[1]}\`  at  **Time:** \`${players.players[i].posHistory[j].time}\``);	
				}
				message.channel.send(playerHistory);
				message.channel.send("Calculating...");
				let pos = players.players[i].pos;
				if (players.players[i].posHistory.length>0) {
					let lastPos = players.players[i].posHistory[players.players[i].posHistory.length-1].pos
					let {distance, theta, dir} = calculateVector(pos, lastPos);
					
					log(`**__${gamertag}'s current positional data:__**`);
					log(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`);
					log(`**From Last Position:** ${lastPos[0]} / ${lastPos[1]}  at  **Last Time:** ${players.players[i].posHistory[players.players[i].posHistory.length-1].time}`);
					log(`**To Latest Position:** ${pos[0]} / ${pos[1]}  at  **Latest Time:** ${players.players[i].time}\n\n------------- End Player Pos History -------------`);

					message.channel.send(`**__${gamertag}'s current positional data:__**`);
					message.channel.send(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`);
					message.channel.send(`**From Last Position:** \`${lastPos[0]} / ${lastPos[1]}\`  at  **Last Time:** \`${players.players[i].posHistory[players.players[i].posHistory.length-1].time}\``);
					message.channel.send(`**To Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);
					return message.channel.send("Done");
				}
				log(`**__${gamertag}'s current positional data:__**`)
				log(`**Latest Position:** ${pos[0]} / ${pos[1]}  at  **Latest Time:** ${players.players[i].time}\n\n------------- End Player Pos History -------------`);
				message.channel.send(`**__${gamertag}'s current positional data:__**`)
				message.channel.send(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);	
				return message.channel.send("Done");
			}
		}
		log(`Player \`${gamertag}\` not found\n\n------------- End Player Pos History -------------`);
		return message.channel.send(`Player \`${gamertag}\` not found`);
	});
}

function updateLogs(message) {
	log("\n------------- Begin Force Update Logs -------------");
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Force Update Logs -------------");return message.channel.send(error);
    if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Force Update Logs -------------");return message.channel.send(stderr);
    log("Successfully executed collect.py");
		log(`Updated Logs\n\n------------- End Force Update Logs -------------`);
		return message.channel.send(`Updated Logs`);
	});
}

function onlineStatus(message, args) {
	log("\n------------- Begin Check Player Connection Status -------------");
	if (args.length==0) return message.channel.send(`You need to provide a gamertag`);
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Check Player Connection Status -------------");return message.channel.send(error);
    if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Check Player Connection Status -------------");return message.channel.send(stderr);
    log("Successfully executed collect.py");	
		let players = require('./players.json');
		let gamertag = getGamertag(args);
		for (let i = 0; i < players.players.length; i++) {
			if (players.players[i].gamertag==gamertag) {
				log(`Player \`${gamertag}\` is \`${players.players[i].connectionStatus}\`\n\n------------- End Check Player Connection Status -------------`);
				return message.channel.send(`Player \`${gamertag}\` is \`${players.players[i].connectionStatus}\``);
			}
		}
		log(`Player \`${gamertag}\` not found\n\n------------- End Check Player Connection Status -------------`);
		return message.channel.send(`Player \`${gamertag}\` not found`);
	});
}

function restartServer(message) {
	log("\n------------- Begin Restart Server -------------");
	exec("python restart.py", (error, stdout, stderr) => {
		if (error!=null&&error!=undefined&&error!="") log("ERROR: ",error,"\n\n------------- End Restart Server -------------");return message.channel.send(error);
    if (stderr!=null&&stderr!=undefined&&stderr!="") log("STD ERROR: ",stderr,"\n\n------------- End Restart Server -------------");return message.channel.send(stderr);
    log("Successfully executed restart.py");
    log("Restarting Server...\n\n------------- End Restart Server -------------")
    return message.channel.send("Restarting Server...");
	});
}

client.on('ready', () => {
  log(`Logged in as ${client.user.tag}`);
});

// Basic Commands
client.on('message', async (message) => {
  let prefix = "?";
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  // Help Embed
  const help = new Discord.MessageEmbed()
    .setColor('#ed3e24')
    .setTitle('**Commands:**')
    .setAuthor('McDazzzled', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')
    .setDescription('Novus Security Commmand')
    .addFields({
      name: `**__Bot Commands:__**`,
      value: `
      **${prefix}help** - \`Displays this help page\`
      **${prefix}ping** - \`Responds with Pong to check Bot responce\`
      **${prefix}playerList** - \`Shows current players\`
      **${prefix}playerHistory** <gamertag> - \`Check specific player history\`
      **${prefix}currentPos** <gamertag> - \`Forces a check for player in base\`
      **${prefix}onlineStatus** <gamertag> - \`Check if player is online\`
			**${prefix}restartServer** - \`Restarts Server\`      
      **${prefix}start** - \`Starts system\`
    	**${prefix}forceCheck** - \`Forces a check for player in base\`
      `,
      inline: false
    })

  // Commands
  if (command == 'ping') { log("\nPing\n");return message.channel.send('Pong!');}
  if (command == 'help') return message.channel.send(help);
  if (command == 'playerlist') {playerList(message);}
  if (command == 'playerhistory') {checkPosHistory(message, args);}
  if (command == 'currentpos') {currentPos(message, args);}
  if (command == 'updatelogs') {updateLogs(message);}
  if (command == 'onlinestatus') {onlineStatus(message, args);}
  if (command == 'restartserver') {restartServer(message);}
  if (command == 'start') { log("\nSystem Alarm Started");message.channel.send("System Alarm Started");startSystem(message);}
  if (command == 'forcecheck') {forceCheck(message);}	
});
client.login(process.env.token);