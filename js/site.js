//TODO
// Clean up console outs
// Make favicon
// Replace text dice with images
// Check if it's working - make sure stats are counting against rolling team rather than the team who's turn it is
//  Casualties in The Cult of Cheese vs Sean Bean Dies A Lot looks fishy
// color team names using same color as charts
// clean up charts - esp by moving around 2db results so the expected results look less random
// try to add number of rolls per team to charts somehow

google.load('visualization', '1.0', {'packages':['corechart']});

var fileInput = document.getElementById("file-input");
fileInput.addEventListener('change', function() {
	$("#loading").show();

	io.xmlToJson(fileInput.files[0],
		function(jsonObj) {
			var replayData = replay.processReplay(jsonObj);
			//console.log(replayData);

			var gameStats = stats.calculateStats(replayData.actions);
			//console.log(gameStats);

			updateGameDetails(replayData.gameDetails);
			updateActions(replayData.actions, replayData.gameDetails, replayData.playerDetails);

			$("#loading").hide();
			$("#results-div").show();

			drawCharts(gameStats, replayData.gameDetails);

			location.hash = "#results";
		},
		function(err) {
			$("#loading").hide();
			alert(err);
		});
});

function raceIdToName(raceId) {
	switch (raceId) {
		case 1: return "Human";
		case 2: return "Dwarf";
		case 3: return "Skaven";
		case 4: return "Orc";
		case 5: return "Lizardman";
		case 7: return "Wood Elf";
		case 8: return "Chaos";
		case 9: return "Dark Elf";
		case 15: return "High Elf";
		case 24 : return "Bretonnian";
		default: return raceId;
	}
}

function rollTypeIdToName(rollType) {
	switch (rollType) {
		case -2: return "Kickoff Scatter"; // 6 sided
		case -1: return "Kickoff"; // 6 sided
		case 1: return "GFI"; // 6 sided
		case 2: return "Dodge"; // 6 sided
		case 3: return "Armour"; // 6 sided
		case 4: return "Injury"; // 6 sided
		case 5: return "Block"; // Block dice
		case 6: return "Stand Up"; // 6 sided
		case 7: return "Pickup"; // 6 sided
		case 8: return "Casualty"; // 6 sided (10s) + 8-sided (1s)
		case 9: return "Catch"; // 6 sided
		case 10: return "Scatter"; // 8 sided if single dice, otherwise it's kick-off scatter which is 8 sided (direction) + 6 sided (distance)
		case 11: return "Throw-in"; // 6 sided?
		case 12: return "Pass"; // 6 sided
		case 16: return "Intercept"; // 6 sided
		case 17: return "Wake-Up After KO"; // 6 sided
		case 20: return "Bone-Head"; // 6 sided
		case 21: return "Really Stupid"; // 6 sided
		case 22: return "Wild Animal"; // 6 sided
		case 23: return "Loner"; // 6 sided
		case 24: return "Landing"; // 6 sided
		case 26: return "Inaccurate Pass Scatter"; // 8 sided
		case 29: return "Dauntless"; // 6 sided
		case 27: return "Always Hungry"; // 6 sided
		case 31: return "Jump Up"; // 6 sided
		case 34: return "Stab"; // 6 sided
		case 36: return "Leap"; // 6 sided
		case 37: return "Foul Appearance"; // 6 sided
		case 40: return "Take Root"; // 6 sided
		case 42: return "Hail Mary Pass"; // 6 sided
		case 46: return "Hypnotic Gaze"; // 6 sided
		case 54: return "Fireball"; // 6 sided
		case 55: return "Lightning Bolt"; // 6 sided
		case 56: return "Throw Team-Mate"; // 6 sided
		case 58: return "Kickoff Gust"; // 8 sided
		default: return rollType;
	}
}

function statsRollTypeIdToName(rollType) {
	switch (rollType) {
		case "standard": return "6 Sided";
		case "scatter": return "Scatter";
		case "block": return "Block";
		case "1db": return "1DB";
		case "2db": return "2DB";
		case "armour": return "Armour";
		case "injury": return "Injury";
		case "casualty": return "Casualty";
		default: return rollTypeIdToName(parseInt(rollType));
	}
}

function diceIdToName(dice, rollType) {
	// Probably want this all to be images

	if (rollType != 5) {
		return dice;
	}
	switch (dice) {
		case 0: return "Skull";
		case 1: return "BothDown";
		case 2: return "Push";
		case 3: return "Stumble";
		case 4: return "Pow";
		default: return dice;
	}
}

function twoDBDiceToName(dice) {
	switch (dice) {
		case 0: return "Skull Skull";
		case 1: return "Skull BothDown";
		case 2: return "Skull Push";
		case 3: return "Skull Stumble";
		case 4: return "Skull Pow";
		case 5: return "BothDown BothDown";
		case 6: return "BothDown Push";
		case 7: return "BothDown Stumble";
		case 8: return "BothDown Pow";
		case 9: return "Push Push";
		case 10: return "Push Stumble";
		case 11: return "Push Pow";
		case 12: return "Stumble Stumble";
		case 13: return "Stumble Pow";
		case 14: return "Pow Pow";
		default: return dice;
	}
}

function injuryDiceToName(dice) {
	switch (dice) {
		case 0: return "Stunned";
		case 1: return "KO'd";
		case 2: return "Casualty";
		default: return dice;
	}
}

function casualtyDiceToName(dice) {
	switch (dice) {
		case 0: return "No Long Term Effect";
		case 1: return "Miss Next Game";
		case 2: return "Niggling Injury";
		case 3: return "-1 MA";
		case 4: return "-1 AV";
		case 5: return "-1 AG";
		case 6: return "-1 ST";
		case 7: return "Dead";
		default: return dice;
	}
}

function diceToName(dice, diceType) {
	if (diceType == 0) {
		return diceIdToName(dice, 5);
	}
	if (diceType == -1) {
		return twoDBDiceToName(dice);
	}
	if (diceType == 3) {
		return dice + 2;
	}
	if (diceType == 4) {
		return injuryDiceToName(dice);
	}
	if (diceType == 5) {
		return casualtyDiceToName(dice);
	}
	return dice + 1;
}

function updateGameDetails(gameDetails) {
	$("#file-name").text(gameDetails.fileName);

	$("#home-coach").text(gameDetails.homeTeam.coachName);
	$("#home-team").text(gameDetails.homeTeam.teamName);
	$("#home-race").text(raceIdToName(gameDetails.homeTeam.raceId));
	$("#home-score").text(gameDetails.homeTeam.score);

	$("#away-coach").text(gameDetails.awayTeam.coachName);
	$("#away-team").text(gameDetails.awayTeam.teamName);
	$("#away-race").text(raceIdToName(gameDetails.awayTeam.raceId));
	$("#away-score").text(gameDetails.awayTeam.score);

	$("#stadium-name").text(gameDetails.stadiumName);
}

function updateActions(actions, gameDetails, playerDetails) {
	$("#roll-details-table tbody").empty();

	$.each(actions, function(index, action) {
		var diceText = $.map(action.dice, function(die) { return diceIdToName(die, action.rollType); });
		var teamName = action.team == 0 ? gameDetails.homeTeam.teamName : gameDetails.awayTeam.teamName;

		$("#roll-details-table tbody").append("<tr>" +
			"<td>" + action.turn + "</td>" +
			"<td>" + teamName + "</td>" +
			"<td>" + (action.player in playerDetails ? playerDetails[action.player].name : "N/A") + "</td>" +
			"<td>" + rollTypeIdToName(action.rollType) + "</td>" +
			"<td>" + diceText.join(" ") + "</td></tr>");
	});
}


function drawCharts(gameStats, gameDetails) {
	//console.log("gameStats", gameStats);

	drawChart("1DBs", "1dbs-chart", gameStats["1db"], gameDetails);
	drawChart("2DBs", "2dbs-chart", gameStats["2db"], gameDetails);
	if (gameStats[2]) {
		drawChart("Dodges", "dodges-chart", gameStats[2], gameDetails);
	}
	drawChart("Armour", "armour-chart", gameStats["armour"], gameDetails);
	drawChart("All Block Dice", "allblocks-chart", gameStats["block"], gameDetails);
	drawChart("All Six-Sided Dice", "sixsided-chart", gameStats["standard"], gameDetails);
}

function roundedPercent(float) {
	var percent = float * 100;
	return Math.round(percent * 100) / 100;
}

function drawChart(title, id, stats, gameDetails) {
	var options = {
		title : title,
		seriesType: 'bars',
		series: {2: {type: 'line'}},
		legend: {position: 'none'},
		focusTarget: 'category',
		width: 600,
		height: 300
	};

	var dataArray = [
		['Result', gameDetails.homeTeam.teamName, gameDetails.awayTeam.teamName, 'Expected']
	];

	$.each(stats[0].histogram, function(index, homeCount) {
		var awayCount = stats[1].histogram[index];

		var diceName = diceToName(index, stats.diceType);
		var homePercent = homeCount == 0 ? 0 : roundedPercent(parseFloat(homeCount) / stats[0].total);
		var awayPercent = awayCount == 0 ? 0 : roundedPercent(parseFloat(awayCount) / stats[1].total);
		var expectedPercent = roundedPercent(stats.expected[index]);

		dataArray.push([diceName, homePercent, awayPercent, expectedPercent]);
	});

	var data = google.visualization.arrayToDataTable(dataArray);
	var chart = new google.visualization.ComboChart(document.getElementById(id));
	chart.draw(data, options);
}