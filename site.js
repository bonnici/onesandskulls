var fileInput = document.getElementById("file-input");
fileInput.addEventListener('change', function() {
	io.xmlToJson(fileInput.files[0],
		function(jsonObj) {
			var replayData = replay.processReplay(jsonObj);
			console.log(replayData);

			var gameStats = stats.calculateStats(replayData.actions);
			console.log(gameStats);

			//todo make the site with foundation and use jquery to update it
			updateGameDetails(replayData.gameDetails);
			updatePlayerDetails(replayData.playerDetails);
			updateActions(replayData.actions, replayData.playerDetails);
			updateStats(gameStats);
		},
		function(err) {
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

function playerTypeIdToName(playerType) {
	//todo
	return playerType;
}

function rollTypeIdToName(rollType) {
	switch (rollType) {
		case -2: return "Kickoff Scatter"; // 6 sided
		case -1: return "Kickoff"; // 6 sided
		case 1: return "GFI"; // 6 sided
		case 2: return "Dodge"; // 6 sided
		case 3: return "Armor"; // 6 sided
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
		case 26: return "Inaccurate Pass"; // 8 sided
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

function statsHistogramToName(dice, diceType) {
	//todo -1 into 2DB

	if (diceType == 0) {
		return diceIdToName(dice, 5);
	}
	return dice;
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

function updatePlayerDetails(playerDetails) {
	$("#player-details-home").empty();
	$("#player-details-away").empty();

	$.each(playerDetails, function(index, player) {
		var playerDom = $("#player-details-template").clone().show();
		playerDom.attr("id", "player-" + player.id + "-details");
		playerDom.find(".player-details-id").text(player.id);
		playerDom.find(".player-details-name").text(player.name);
		playerDom.find(".player-details-type").text(playerTypeIdToName(player.type));

		playerDom.appendTo($("#player-details-" + (player.teamId == 0 ? "home" : "away")));
	});
}

function updateActions(actions, playerDetails) {
	$("#roll-details-table tbody").empty();

	$.each(actions, function(index, action) {
		var diceText = $.map(action.dice, function(die) { return diceIdToName(die, action.rollType); });

		$("#roll-details-table tbody").append("<tr>" +
			"<td>" + action.activeTeam + "</td>" +
			"<td>" + action.turn + "</td>" +
			"<td>" + (action.player in playerDetails ? playerDetails[action.player].name : "N/A") + "</td>" +
			"<td>" + rollTypeIdToName(action.rollType) + "</td>" +
			"<td>" + diceText.join(" ") + "</td></tr>");
	});
}

function updateStats(stats) {
	$("#stats").empty();

	$.each(stats, function(rollType, details) {
		var statDom = $("#stats-template").clone().show();
		statDom.find(".stats-roll-type").text(statsRollTypeIdToName(rollType));

		$.each(details.histogram, function(index, count) {
			var histogramText = statsHistogramToName(index, details.diceType);
			var percent = count == 0 ? 0 : parseInt(parseFloat(count) / details.total * 100);

			statDom.find(".stats-table tbody").append("<tr>" +
				"<td>" + histogramText + "</td>" +
				"<td>" + count + "</td>" +
				"<td>" + percent + "</td>" + "</td></tr>");
		});

		statDom.appendTo($("#stats"));
	});
}