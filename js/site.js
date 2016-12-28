/* Minifier: http://jscompress.com/ */

google.load('visualization', '1.0', {'packages':['corechart']});
google.setOnLoadCallback(enableFileInput);

function enableFileInput() {
	$("#file-input-button").removeClass("disabled");
}

var fileInput = document.getElementById("file-input");
fileInput.addEventListener('change', function() {
	if (fileInput.files.length > 0) {
		$("#loading").show();
		$("#data-param-error").hide();
		$("#summary-div").hide();
		$("#results-div").hide();
		$("#share-alert").hide();
		$("#blockdice").hide();

		io.xmlToJson(fileInput.files[0],
			function (jsonObj) {
				var replayData = replay.processReplay(jsonObj);

				var jsoncCompressedJson = JSONC.compress(replayData);
				var jsoncCompressedString = JSON.stringify(jsoncCompressedJson);
				var lzstringCompressed = LZString.compressToEncodedURIComponent(jsoncCompressedString);

				renderReplayData(replayData, lzstringCompressed);
			},
			function (err) {
				$("#loading").hide();
				alert(err);
			});
	}
});

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1]);
}

var dataParam = getParameterByName("data");
if (dataParam) {
	$("#loading").show();
	$("#data-param-error").hide();
	google.setOnLoadCallback(renderDataParam);
}

function renderDataParam() {
	try {
		var decompressedString = LZString.decompressFromEncodedURIComponent(dataParam);
		var replayData = JSONC.decompress(JSON.parse(decompressedString));
		renderReplayData(replayData, dataParam);
	}
	catch(err) {
		$("#loading").hide();
		$("#data-param-error").show();
		console.error(err);
	}
}

var adUnit =
'<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script> \n' +
'	<!-- Ones and Skulls results --> \n' +
'   <ins class="adsbygoogle" \n' +
'       style="display:block" \n' +
'       data-ad-client="ca-pub-4369217296754794" \n' +
'       data-ad-slot="9894359687" \n' +
'       data-ad-format="auto"></ins> \n' +
'<script> \n' +
'	(adsbygoogle = window.adsbygoogle || []).push({}); \n' +
'</script>';

function showResultsAd() {
	//console.log("showResultsAd");
	if ($("#middle-ad").find("ins").length == 0) {
		//console.log(adUnit);
		$("#middle-ad").html(adUnit);
	}
}

function renderReplayData(replayData, dataParam) {
	//console.log("replayData:");
	//console.log(replayData);
	//console.log("dataParam:");
	//console.log(dataParam);

	//var baseUrl = "http://localhost:8080";
	var baseUrl = "http://onesandskulls.com";
	var resultsPage = "/index.html";
	var resultsUrl = baseUrl + resultsPage + "?data=" + dataParam;
	var encodedResultsUrl = encodeURIComponent(resultsUrl);
	var tinyUrlCreator = "http://tinyurl.com/create.php?url=" + encodedResultsUrl + "#success";
	//console.log("resultsUrl", resultsUrl);
	//console.log("tinyUrlCreator", tinyUrlCreator);

	var gameStats = stats.calculateStats(replayData.actions, replayData.playerDetails);
	//console.log("gameStats");
	//console.log(gameStats);

	updateGameDetails(replayData.gameDetails);
	updateActions(replayData.actions, replayData.gameDetails, replayData.playerDetails);

	$("#loading").hide();
	$("#summary-div").show();
	$("#results-div").show();

	showResultsAd();

	$("#blockdice").show();

	$("#share-massive-url").attr("href", resultsUrl);
	$("#share-tiny-url").attr("href", tinyUrlCreator);
	$("#share-alert").show();


	//console.log("Deleting other stats " + $(".other-stats").length);
	$(".other-stats").remove();

	drawCharts(gameStats, replayData.gameDetails);

	document.getElementById('results-with-padding').scrollIntoView();
}

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
		case 59: return "Armour"; // pre-piling on roll
		case 60: return "Injury"; // pre-piling on roll
		default: return rollType;
	}
}

function diceIdToName(dice, rollType) {
	// Probably want this all to be images

	if (rollType != 5) {
		return dice;
	}
	switch (dice) {
		case 0: return "AD";
		case 1: return "BD";
		case 2: return "P";
		case 3: return "DS";
		case 4: return "DD";
		default: return dice;
	}
}

function twoDBDiceToName(dice) {
	switch (dice) {
		case 0: return "AD AD";
		case 1: return "AD BD";
		case 2: return "AD P";
		case 3: return "AD DS";
		case 4: return "AD DD";
		case 5: return "BD BD";
		case 6: return "BD P";
		case 7: return "BD DS";
		case 8: return "BD DD";
		case 9: return "P P";
		case 10: return "P DS";
		case 11: return "P DD";
		case 12: return "DS DS";
		case 13: return "DS DD";
		case 14: return "DD DD";
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
	else if (diceType == -1) {
		return twoDBDiceToName(dice);
	}
	else if (diceType == 3) {
		return dice + 2;
	}
	else if (diceType == 4) {
		//return injuryDiceToName(dice);
		return dice + 2;
	}
	else if (diceType == 5) {
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

		var turnClass = action.team == 0 ? "home" : "away";
		var playerClass = turnClass;
		if (action.player in playerDetails) {
			playerClass = playerDetails[action.player].teamId == 0 ? "home" : "away";
		}

		$("#roll-details-table tbody").append("<tr>" +
			'<td class="' + turnClass + '">' + action.turn + " (" + teamName + ")</td>" +
			'<td class="' + playerClass + '">' + (action.player in playerDetails ? playerDetails[action.player].name : "N/A") + "</td>" +
			'<td class="' + playerClass + '">' + rollTypeIdToName(action.rollType) + "</td>" +
			'<td class="' + playerClass + '">' + diceText.join(" ") + "</td></tr>");
	});
}


function drawCharts(gameStats, gameDetails) {
	//console.log("gameStats", gameStats);

	drawStatCharts("1DB", "1dbs", gameStats["1db"], gameDetails);
	delete gameStats["1db"];

	drawStatCharts("2DB", "2dbs",  gameStats["2db"], gameDetails);
	delete gameStats["2db"];

	drawStatCharts("Dodge", "dodges", gameStats[2], gameDetails);
	delete gameStats[2];

	drawStatCharts("Armour", "armour", gameStats["armour"], gameDetails);
	delete gameStats["armour"];

	drawStatCharts("All Block Dice", "allblocks", gameStats["block"], gameDetails);
	delete gameStats["block"];

	drawStatCharts("All Six-Sided (non-Block) Dice", "sixsided", gameStats["standard"], gameDetails);
	delete gameStats["standard"];

	drawStatCharts("All Scatter Dice", "scatter", gameStats["scatter"], gameDetails);
	delete gameStats["scatter"];

	drawStatCharts("Injury", "injury", gameStats["injury"], gameDetails);
	delete gameStats["injury"];

	drawStatCharts("Casualty", "cas", gameStats["casualty"], gameDetails);
	delete gameStats["casualty"];

	$.each(gameStats, function(rollType, stats) {
		makeChartDiv(rollType);
		drawStatCharts(rollTypeIdToName(parseInt(rollType)), rollType, stats, gameDetails);
	});
}

function roundedPercent(float) {
	var percent = float * 100;
	return Math.round(percent * 100) / 100;
}

// Hack to resort 2DB into something that is less randomly spread
function adjustIndex(index, diceType) {
	if (diceType != -1) {
		return index+1;
	}

	switch (index) {
		case 0: return 1;   // "AD AD";
		case 1: return 5;   // "AD BD";
		case 2: return 11;  // "AD P";
		case 3: return 6;   // "AD DS";
		case 4: return 7;   // "AD DD";
		case 5: return 2;   // "BD BD";
		case 6: return 12;  // "BD P";
		case 7: return 8;   // "BD DS";
		case 8: return 9;   // "BD DD";
		case 9: return 13;  // "P P";
		case 10: return 14; // "P DS";
		case 11: return 15; // "P DD";
		case 12: return 3;  // "DS DS";
		case 13: return 10; // "DS DD";
		case 14: return 4;  // "DD DD";
		default: return index+1;
	}
}

function drawStatCharts(title, idPrefix, stats, gameDetails) {
	var hAxisTicks = "auto";
	switch (stats.diceType) {
		case 1: hAxisTicks = [1,2,3,4,5,6]; break;
		case 2: hAxisTicks = [1,2,3,4,5,6,7,8]; break;
		case 3:
		case 4:
			hAxisTicks = [2,3,4,5,6,7,8,9,10,11,12]; break;
	}

	var pctOptions = {
		title : title + " Percentages",
		seriesType: 'bars',
		series: {2: {type: 'line'}},
		legend: {position: 'none'},
		hAxis: { ticks: hAxisTicks },
		focusTarget: 'category',
		width: 600,
		height: 300
	};
	var countOptions = {
		title : title + " Counts",
		seriesType: 'bars',
		legend: {position: 'none'},
		hAxis: { ticks: hAxisTicks },
		focusTarget: 'category',
		width: 600,
		height: 300
	};

	var pctDataArray = [
		['Result', gameDetails.homeTeam.teamName, gameDetails.awayTeam.teamName, 'Expected']
	];
	var countDataArray = [
		['Result', gameDetails.homeTeam.teamName, gameDetails.awayTeam.teamName]
	];

	var homeTotalCount = 0, awayTotalCount = 0;
	$.each(stats[0].histogram, function (index, homeCount) {
		if (!isNaN(homeCount)) {
			var awayCount = stats[1].histogram[index];

			var diceName = diceToName(index, stats.diceType);
			var homePercent = homeCount == 0 ? 0 : roundedPercent(parseFloat(homeCount) / stats[0].total);
			var awayPercent = awayCount == 0 ? 0 : roundedPercent(parseFloat(awayCount) / stats[1].total);
			var expectedPercent = roundedPercent(stats.expected[index]);

			var adjustedIndex = adjustIndex(index, stats.diceType);

			pctDataArray[adjustedIndex] = [diceName, homePercent, awayPercent, expectedPercent];
			countDataArray[adjustedIndex] = [diceName, homeCount, awayCount];

			homeTotalCount += homeCount;
			awayTotalCount += awayCount;
		}
	});

	countOptions.title += '\nTotals - ' + gameDetails.homeTeam.teamName + ': ' + homeTotalCount + ', ' + gameDetails.awayTeam.teamName + ": " + awayTotalCount;

	var pctData = google.visualization.arrayToDataTable(pctDataArray);
	var pctChart = new google.visualization.ComboChart(document.getElementById(idPrefix + "-pct-chart"));
	pctChart.draw(pctData, pctOptions);

	var countData = google.visualization.arrayToDataTable(countDataArray);
	var countChart = new google.visualization.ComboChart(document.getElementById(idPrefix + "-count-chart"));
	countChart.draw(countData, countOptions);
}

function makeChartDiv(idPrefix) {
	//console.log("Making chart div for " + idPrefix); 
	var dom = $("#other-stats-template").clone().show();
	dom.removeAttr("id").addClass('other-stats');
	dom.find(".pct-chart").attr("id", idPrefix + "-pct-chart");
	dom.find(".count-chart").attr("id", idPrefix + "-count-chart");
	dom.appendTo($("#charts"));
}