const { exec } = require('child_process');
const Discord = require('discord.js');
const client = new Discord.Client({disableEveryone: false, intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]});
const dotenv = require('dotenv');
dotenv.config();

const minute = 60000; //1 minute in milliseconds
let i = 0;

const whitelist = [
"McDazzzled",
"GETCLSAP",
"A 356ft Giraffe",
"Toxic7077",
"III8 Luigi 8III",
"lll8 Luigi 8lll",
"XxGhost314xX",
"AmusingSquash93",
"xXAxeManHDXx",
"XxXSumRandomGuy",
"Mightymouse2868",
"ReaperACT",
"EMS x INDRA",
"Enragedcross99",
"MADDHATTER1775"
]

function check(message) {
	console.log("\n------------- Begin Check -------------")
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Check -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Check -------------");return message.channel.send(stderr);}
    console.log("Successfully executed collect.py");
    // Check Data
		let players = require('./players.json');
		for (let i = 0; i < players.players.length; i++) {
			let px = players.players[i].pos[0];
			let py = players.players[i].pos[1];
			// Inside Bounderies
			if (px>2326.84&&px<2995.71&&py<1625.04&&py>1061.15) {
				if (!whitelist.includes(players.players[i].gamertag)) {
					console.log(`Player ${players.players[i].gamertag} found in base.\n\n------------- End Check -------------`);
					return message.channel.send(`@everyone \`${players.players[i].gamertag}\` is in our base!`);
				}
			}
		}
		console.log("No players found\n\n------------- End Check -------------")
	});
}

function startSystem(message) {
	check(message);
  i += 1;
  setTimeout(function() {
    if (i <= 48) {
      startSystem(message);
    } else console.log("\nSystem Alarm Disabled");return message.channel.send("System Alarm Disabled");
  }, minute*5);
}

function forceCheck(message) {
	console.log("\n------------- Begin Force Check -------------")
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Force Check -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Force Check -------------");return message.channel.send(stderr);}
    console.log("Successfully executed collect.py");
    message.channel.send("Checking...")
		let players = require('./players.json');
		for (let i = 0; i < players.players.length; i++) {
			let px = players.players[i].pos[0]
			let py = players.players[i].pos[1]
			// Inside Bounderies
			if (px>2326.84&&px<2995.71&&py<1625.04&&py>1061.15) {
				if (!whitelist.includes(players.players[i].gamertag)) {
					console.log(`Player ${players.players[i].gamertag} found in base.`);
					return message.channel.send(`@everyone \`${players.players[i].gamertag}\` is in our base!\n\n------------- End Force Check -------------`);
				}
			}
		}
		console.log("No players found")
		return message.channel.send('None\n\n------------- End Force Check -------------');
	});
}

function playerList(message) {
	console.log("\n------------- Begin Collect Player List -------------")
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Collect Player List -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Collect Player List -------------");return message.channel.send(stderr);}
    console.log("Successfully executed collect.py");
		let players = require('./players.json');
		let playerList = [];
		if (players.players.length==0) return message.channel.send("No players in logs");
		for (let i = 0; i < players.players.length; i++) {
			playerList.push(players.players[i].gamertag)
		}
		console.log(playerList,"\n------------- End Collect Player List -------------");
		return message.channel.send(playerList);
	});
}

function currentPos(message, args) {
	console.log("\n------------- Begin Current Player Pos -------------")
	if (args.length==0) return message.channel.send(`You need to provide a gamertag`);
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Current Player Pos -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Current Player Pos -------------");return message.channel.send(stderr);}
    console.log("Successfully executed collect.py");		
		let players = require('./players.json');
		let gamertag=""
		if (args.length>1) {
			for (let i = 0; i < args.length; i++) {
				if ((i+1)==args.length) {
					gamertag = gamertag + args[i];
				} else gamertag = gamertag + args[i] + " ";
			}
		} else {gamertag=args[0]}
		for (let i = 0; i < players.players.length; i++) {
			if (players.players[i].gamertag==gamertag) {
				let pos = players.players[i].pos;
				message.channel.send("Calculating...")
				if (players.players[i].posHistory.length>0) {
					let lastPos = players.players[i].posHistory[players.players[i].posHistory.length-1].pos
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
					
					console.log(`**__${gamertag}'s current positional data:__**`)
					console.log(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`)
					console.log(`**From Last Position:** \`${lastPos[0]} / ${lastPos[1]}\`  at  **Last Time:** \`\`${players.players[i].posHistory[players.players[i].posHistory.length-1].time}\``)
					console.log(`**To Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\`\n\n------------- End Current Player Pos -------------`)

					message.channel.send(`**__${gamertag}'s current positional data:__**`)
					message.channel.send(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`);
					message.channel.send(`**From Last Position:** \`${lastPos[0]} / ${lastPos[1]}\`  at  **Last Time:** \`${players.players[i].posHistory[players.players[i].posHistory.length-1].time}\``);
					return message.channel.send(`**To Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);
				}
				console.log(`**__${gamertag}'s current positional data:__**`)
				console.log(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\`\n\n------------- End Current Player Pos -------------`)
				message.channel.send(`**__${gamertag}'s current positional data:__**`)
				return message.channel.send(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);	
			}
		}
		console.log(`Player \`${args[0]}\` not found\n\n------------- End Current Player Pos -------------`)
		return message.channel.send(`Player \`${args[0]}\` not found`);
	});
}

function checkPosHistory(message, args) {
	console.log("\n------------- Begin Player Pos History -------------")
	if (args.length==0) return message.channel.send(`You need to provide a gamertag`);
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Player Pos History -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Player Pos History -------------");return message.channel.send(stderr);}
    console.log("Successfully executed collect.py");	
		let players = require('./players.json');
		let gamertag=""
		if (args.length>1) {
			for (let i = 0; i < args.length; i++) {
				if ((i+1)==args.length) {
					gamertag = gamertag + args[i];
				} else gamertag = gamertag + args[i] + " ";
			}
		} else {gamertag=args[0]}
		for (let i = 0; i < players.players.length; i++) {
			if (players.players[i].gamertag==gamertag) {
				console.log(`**__${gamertag}'s positional history:__**`);
				console.log(`**Latest Positions:** \`${players.players[i].pos[0]} / ${players.players[i].pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);
				let playerHistory = [];
				message.channel.send(`**__${gamertag}'s positional history:__**`)
				message.channel.send(`**Latest Positions:** \`${players.players[i].pos[0]} / ${players.players[i].pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);	
				message.channel.send(`Collecting Position History...`);
				for (let j = 0; j < players.players[i].posHistory.length; j++) {
					console.log(`**Position:** ${players.players[i].posHistory[j].pos[0]} / ${players.players[i].posHistory[j].pos[1]}  at  **Time:** ${players.players[i].posHistory[j].time}`)
					playerHistory.push(`**Position:** \`${players.players[i].posHistory[j].pos[0]} / ${players.players[i].posHistory[j].pos[1]}\`  at  **Time:** \`${players.players[i].posHistory[j].time}\``);	
				}
				message.channel.send(playerHistory);
				message.channel.send("Calculating...");
				let pos = players.players[i].pos;
				if (players.players[i].posHistory.length>0) {
					let lastPos = players.players[i].posHistory[players.players[i].posHistory.length-1].pos
					let diff = [Math.round(lastPos[0] - pos[0]), Math.round(lastPos[1] - pos[1])];
					let distance = Math.sqrt(Math.pow(diff[0], 2) + Math.pow(diff[1], 2)).toFixed(2)
					let theta = Math.abs(Math.atan(diff[1]/diff[0])*180/Math.PI).toFixed(1);
					let dir;

					if (pos[0]>lastPos[0]&&pos[1]>lastPos[1]) dir = "North East";
					if (pos[0]<lastPos[0]&&pos[1]>lastPos[1]) dir = "South East";
					if (pos[0]>lastPos[0]&&pos[1]==lastPos[1]) dir = "North";
					if (pos[0]<lastPos[0]&&pos[1]==lastPos[1]) dir = "South";
					if (pos[0]>lastPos[0]&&pos[1]<lastPos[1]) dir = "North West";
					if (pos[0]<lastPos[0]&&pos[1]<lastPos[1]) dir = "South West";
					if (pos[0]==lastPos[0]&&pos[1]>lastPos[1]) dir = "East";
					if (pos[0]==lastPos[0]&&pos[1]<lastPos[1]) dir = "West";
					
					console.log(`**__${gamertag}'s current positional data:__**`)
					console.log(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`)
					console.log(`**From Last Position:** ${lastPos[0]} / ${lastPos[1]}  at  **Last Time:** ${players.players[i].posHistory[players.players[i].posHistory.length-1].time}`)
					console.log(`**To Latest Position:** ${pos[0]} / ${pos[1]}  at  **Latest Time:** ${players.players[i].time}\n\n------------- End Player Pos History -------------`)

					message.channel.send(`**__${gamertag}'s current positional data:__**`)
					message.channel.send(`**${gamertag}** has moved **__${distance}m @${theta}° ${dir}__**`);
					message.channel.send(`**From Last Position:** \`${lastPos[0]} / ${lastPos[1]}\`  at  **Last Time:** \`${players.players[i].posHistory[players.players[i].posHistory.length-1].time}\``);
					message.channel.send(`**To Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);
					return message.channel.send("Done");
				}
				console.log(`**__${gamertag}'s current positional data:__**`)
				console.log(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\`\n\n------------- End Player Pos History -------------`)
				message.channel.send(`**__${gamertag}'s current positional data:__**`)
				message.channel.send(`**Latest Position:** \`${pos[0]} / ${pos[1]}\`  at  **Latest Time:** \`${players.players[i].time}\``);	
				return message.channel.send("Done");
			}
		}
		console.log(`Player \`${args[0]}\` not found\n\n------------- End Player Pos History -------------`)
		return message.channel.send(`Player \`${args[0]}\` not found`);
	});
}

function updateLogs(message) {
	console.log("\n------------- Begin Force Update Logs -------------")
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Force Update Logs -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Force Update Logs -------------");return message.channel.send(stderr);}
    console.log("Successfully executed collect.py");
		console.log(`Updated Logs\n\n------------- End Force Update Logs -------------`)
		return message.channel.send(`Updated Logs`);
	});
}

function onlineStatus(message, args) {
	console.log("\n------------- Begin Check Player Connection Status -------------")
	if (args.length==0) return message.channel.send(`You need to provide a gamertag`);
	exec("python collect.py", (error, stdout, stderr) => {
    if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Check Player Connection Status -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Check Player Connection Status -------------");return message.channel.send(stderr);}
    console.log("Successfully executed collect.py");	
		let players = require('./players.json');
		let gamertag=""
		if (args.length>1) {
			for (let i = 0; i < args.length; i++) {
				if ((i+1)==args.length) {
					gamertag = gamertag + args[i];
				} else gamertag = gamertag + args[i] + " ";
			}
		} else {gamertag=args[0]}
		for (let i = 0; i < players.players.length; i++) {
			if (players.players[i].gamertag==gamertag) {
				console.log(`Player \`${gamertag}\` is \`${players.players[i].connectionStatus}\`\n\n------------- End Check Player Connection Status -------------`);
				return message.channel.send(`Player \`${gamertag}\` is \`${players.players[i].connectionStatus}\``);
			}
		}
		console.log(`Player \`${args[0]}\` not found\n\n------------- End Check Player Connection Status -------------`)
		return message.channel.send(`Player \`${args[0]}\` not found`);
	});
}

function restartServer(message) {
	console.log("\n------------- Begin Restart Server -------------")
	exec("python restart.py", (error, stdout, stderr) => {
		if (error!=null&&error!=undefined&&error!="") {console.log("ERROR: ",error,"\n\n------------- End Restart Server -------------");return message.channel.send(error);}
    if (stderr!=null&&stderr!=undefined&&stderr!="") {console.log("STD ERROR: ",stderr,"\n\n------------- End Restart Server -------------");return message.channel.send(stderr);}
    console.log("Successfully executed restart.py");
    console.log("Restarting Server...\n\n------------- End Restart Server -------------")
    return message.channel.send("Restarting Server...");
	});
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Basic Commands
client.on('message', async (message) => {
  let prefix = "?";
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  // Help Embed
  const help = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('**Commands:**')
    .setAuthor('McDazzzled', 'https://avatars.githubusercontent.com/u/48144618?v=4', 'https://github.com/SowinskiBraeden')
    .setDescription('Novus Security Commmand')
    .addFields({
      name: `**__Bot Commands:__**`,
      value: `
      **${prefix}help** - \`Displays this help page\`
      **${prefix}ping** - \`Responds with Pong to check Bot responce\`
      **${prefix}start** - \`Starts system\`
      **${prefix}playerList** - \`Shows current players\`
      **${prefix}playerHistory** <gamertag> - \`Check specific player history\`
      **${prefix}forceCheck** - \`Forces a check for player in base\`
      **${prefix}currentPos** <gamertag> - \`Forces a check for player in base\`
      **${prefix}onlineStatus** <gamertag> - \`Check if player is online\`
			**${prefix}restartServer** - \`Restarts Server\`      
      `,
      inline: false
    })

  // Commands
  if (command == 'ping') {console.log("\nPing\n");return message.channel.send('Pong!');}
  if (command == 'help') return message.channel.send(help);
  if (command == 'start') {console.log("\nSystem Alarm Started");message.channel.send("System Alarm Started");startSystem(message);}
  if (command == 'playerlist') {playerList(message);}
  if (command == 'playerhistory') {checkPosHistory(message, args);}
  if (command == 'forcecheck') {forceCheck(message);}
  if (command == 'currentpos') {currentPos(message, args);}
  if (command == 'updatelogs') {updateLogs(message);}
  if (command == 'onlinestatus') {onlineStatus(message, args);}
  if (command == 'restartserver') {restartServer(message);}
});
client.login(process.env.token);