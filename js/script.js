//console.log("Hello, world!");
zip.workerScriptsPath = "/lib/zipjs/";
//console.log(zip);

// https://developer.mozilla.org/en-US/docs/JXON#Algorithm_.233.3A_a_synthetic_technique
// timing: 1479 1570 1667
function parseText (sValue) {
	if (/^\s*$/.test(sValue)) { return null; }
	if (/^(?:true|false)$/i.test(sValue)) { return sValue.toLowerCase() === "true"; }
	if (isFinite(sValue)) { return parseFloat(sValue); }
	if (isFinite(Date.parse(sValue))) { return new Date(sValue); }
	return sValue;
}

function getJXONTree (oXMLParent) {
	var vResult = /* put here the default value for empty nodes! */ true, nLength = 0, sCollectedTxt = "";
	/*
	if (oParentNode.hasAttributes && oXMLParent.hasAttributes()) {
		vResult = {};
		for (nLength; nLength < oXMLParent.attributes.length; nLength++) {
			oAttrib = oXMLParent.attributes.item(nLength);
			vResult["@" + oAttrib.name.toLowerCase()] = parseText(oAttrib.value.trim());
		}
	}
	*/
	if (oXMLParent.hasChildNodes()) {
		for (var oNode, sProp, vContent, nItem = 0; nItem < oXMLParent.childNodes.length; nItem++) {
			oNode = oXMLParent.childNodes.item(nItem);
			if (oNode.nodeType === 4) { sCollectedTxt += oNode.nodeValue; } /* nodeType is "CDATASection" (4) */
			else if (oNode.nodeType === 3) { sCollectedTxt += oNode.nodeValue.trim(); } /* nodeType is "Text" (3) */
			else if (oNode.nodeType === 1 && !oNode.prefix) { /* nodeType is "Element" (1) */
				if (nLength === 0) { vResult = {}; }
				sProp = oNode.nodeName.toLowerCase();
				vContent = getJXONTree(oNode);
				if (vResult.hasOwnProperty(sProp)) {
					if (vResult[sProp].constructor !== Array) { vResult[sProp] = [vResult[sProp]]; }
					vResult[sProp].push(vContent);
				} else { vResult[sProp] = vContent; nLength++; }
			}
		}
	}
	if (sCollectedTxt) { nLength > 0 ? vResult.keyValue = parseText(sCollectedTxt) : vResult = parseText(sCollectedTxt); }
	/* if (nLength > 0) { Object.freeze(vResult); } */
	return vResult;
}

// http://davidwalsh.name/convert-xml-json
//timing: 1897 1795 1944
function xmlToJson(xml) {

	// Create the return object
	var obj = {};

	if (xml.nodeType == 1) { // element
		// do attributes
		if (xml.attributes.length > 0) {
			obj["@attributes"] = {};
			for (var j = 0; j < xml.attributes.length; j++) {
				var attribute = xml.attributes.item(j);
				obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
			}
		}
	} else if (xml.nodeType == 3) { // text
		obj = xml.nodeValue;
	}

	// do children
	if (xml.hasChildNodes()) {
		for(var i = 0; i < xml.childNodes.length; i++) {
			var item = xml.childNodes.item(i);
			var nodeName = item.nodeName;
			if (typeof(obj[nodeName]) == "undefined") {
				obj[nodeName] = xmlToJson(item);
			} else {
				if (typeof(obj[nodeName].push) == "undefined") {
					var old = obj[nodeName];
					obj[nodeName] = [];
					obj[nodeName].push(old);
				}
				obj[nodeName].push(xmlToJson(item));
			}
		}
	}
	return obj;
}


//var x2js = new X2JS();

function textToJson(text) {
	/* takes 3 seconds
	var start =  new Date();
	console.log("start: " + start);

	var jsObj = x2js.xml_str2json(text);

	var end =  new Date();
	console.log("end: " + end);
	console.log("total time: " + (end.getTime() - start.getTime()));
	return jsObj;
	*/

	var start =  new Date();
	console.log("start: " + start);
	//var jsTree = getJXONTree(text);

	var parser = new DOMParser();
	var xmlDom = parser.parseFromString(text, "text/xml");
	var domMade =  new Date();
	console.log("dom made: " + domMade);

	var jsTree = getJXONTree(xmlDom);
	//var jsTree = xmlToJson(xmlDom);
	var end =  new Date();
	console.log("end: " + end);
	console.log("total time: " + (end.getTime() - start.getTime()));
	console.log(jsTree);
	return jsTree;

	/*
	 var start =  new Date();
	 console.log("start: " + start);
	 var parser = new DOMParser();
	 window.xmlDom = parser.parseFromString(text, "text/xml");
	 var domMade =  new Date();
	 console.log("dom made: " + domMade);
	 //console.log(xmlDom);

	 var replaySteps = window.xmlDom.getElementsByTagName("ReplayStep");
	 for (var i=0; i < replaySteps.length; i++) {
	 var replayStep = replaySteps[i];
	 var jsStep = getJXONTree(replayStep);
	 //console.log(jsStep);
	 }
	 var end =  new Date();
	 console.log("end: " + end);
	 console.log("total time: " + (end.getTime() - start.getTime()));
	 */
}

//todo remove globals and clean up a lot
var playerDetails = {};
var storedDetails = [];

function processReplayStep(stepIndex, replayStep) {
	var kickoffDetails  = extractKickoffDetails(stepIndex, replayStep);
	if (kickoffDetails) {
		storedDetails.push(kickoffDetails);
	}

	var actions = replayStep.ruleseventboardaction;
	if (actions && actions.length) {
		for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
			var action = actions[actionIndex];
			processAction(stepIndex, replayStep, action);
		}
	}
	else if (actions) {
		processAction(stepIndex, replayStep, actions);
	}
}

function processAction(stepIndex, replayStep, action) {
	if (!action) return;

	var results = action.results.boardactionresult;
	if (results && results.length) {
		for (var resultIndex = 0; resultIndex < results.length; resultIndex++) {
			var result = results[resultIndex];
			processResult(stepIndex, replayStep, action, result);
		}
	} else {
		processResult(stepIndex, replayStep, action, results);
	}
}

function processResult(stepIndex, replayStep, action, result) {
	if (!result) return;

	if (result.coachchoices && result.coachchoices.listdices) {
		storedDetails.push(extractActionDetails(stepIndex, replayStep, action, result));
	}
}

function extractActionDetails(stepIndex, replayStep, action, result) {
	var details = {
		step: stepIndex,
		activeTeam: replayStep.boardstate.activeteam ? "Home" : "Away",
		turn: replayStep.boardstate.listteams.teamstate[replayStep.boardstate.activeteam || 0].gameturn || 0,
		//currentPhase: replayStep.boardstate.currentphase, // always 5 or nothing - 5 is probably after setup, during actual gameplay
		player: action.playerid,
		//actionRequestType: action.requesttype, // always 1, 1 = roll?
		actionType: action.actiontype || 0,
		rollType: result.rolltype,
		//requirement: result.requirement,
		//concernedTeam: result.coachchoices.concernedteam, // always null or 1 - does null mean 0?
		//completed: result.isordercompleted, // I *think* this signals the end of the action
		rollStatus: result.rollstatus,
		requestType: result.requesttype,
		resultType: result.resulttype,
		subresultType: result.subresulttype,
		//reroll: result.coachchoices.reroll, // I *think* this means a reroll is available if it's 1
		dice: result.coachchoices.listdices
	};

	// Block and casualty rolls come up twice for some reason, but the second one has isordercompleted set to null
	//if ((details.rollType == 5 || details.rollType == 8) && result.isordercompleted == 1) {
	//	return null;
	//}

	//temp
	//if (details.rollType != 5) return null;

	// As far as I can tell, this comes up when a reroll was possible but not used
	if (result.rollstatus == 2) {
		return null;
	}

	// This is the foul penalty - the roll is already covered by an armor roll
	if (details.rollType == 15) {
		return null;
	}

	// This is some sort of wrestle roll which doesn't do anything
	if (details.rollType == 61) {
		return null;
	}

	// Block dice have dice repeated for the coaches selection, resulttype is missing for the second one
	if (details.rollType == 5 && (result.resulttype != 2 /*|| result.rollstatus == 2*/)) {
		return null;
	}

	// Just guessing at this
	if (details.rollType == 8 && result.resulttype != 2 && result.subresulttype != 1) {
		return null;
	}

	/*
	// No idea why this one shows up, is it an apoc? the replay I saw didn't show a reroll
	if (details.rollType == 4 && result.rollstatus == 2) {
		return null;
	}

	// Seeing a pattern here
	if (details.rollType == 1 && result.rollstatus == 2) {
		return null;
	}
	*/


	if (details.player in playerDetails) {
		details.player = playerDetails[details.player].name + " (" + details.player + ")";
	}

	// Don't need to store this for all actions
	//details.coachName = replayStep.gameinfos.coachesinfos.coachinfos[details.activeTeam].userid;
	//details["teamName"] = replayStep.boardstate.listteams.teamstate[details.activeTeam].data.name;

	details.dice = translateDice(details.dice, details.rollType);
	details.rollType = translateRollType(details.rollType);

	//console.log(details);
	return details;
}

function translateRollType(rollType) {
	switch (rollType) {
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
		//case 61: return "Wrestle?";
		default: return rollType;
	}
}

function translateDice(dice, rollType) {
	var diceList = translateStringNumberList(dice);

	// For some reason block dice have an extra set of dice at the end
	if (rollType == 5) {
		diceList = diceList.slice(0, diceList.length / 2);

		for (var i=0; i < diceList.length; i++) {
			diceList[i] = translateBlockDice(diceList[i]);
		}
	}

	// Casualty dice are also doubled up, and also both rolls appear when an apoc is used (so the last one is the valid one)
	if (rollType == 8) {
		diceList = diceList.slice(0, diceList.length / 2);
		diceList = [diceList[diceList.length - 1]];
	}

	//return diceList;
	return diceList.join(" ");
}

function translateBlockDice(dice) {
	switch (dice) {
		case "0": return "Skull";
		case "1": return "BothDown";
		case "2": return "Push";
		case "3": return "Stumbles";
		case "4": return "Pow";
		default: return dice;
	}
}

function translateStringNumberList(str) {
	if (!str) return [];

	var stripped = str.substring(1, str.length-1);
	return stripped.split(",");
}

function extractKickoffDetails(stepIndex, replayStep) {
	if (!replayStep.ruleseventkickofftable) return;

	var details = {
		step: stepIndex,
		activeTeam: replayStep.boardstate.activeteam ? "Home" : "Away",
		turn: replayStep.boardstate.listteams.teamstate[replayStep.boardstate.activeteam || 0].gameturn || 0,
		rollType: "Kickoff",
		dice: replayStep.ruleseventkickofftable.listdice
	};
	//details.coachName = replayStep.gameinfos.coachesinfos.coachinfos[details.activeTeam].userid;
	details.dice = translateDice(details.dice, details.rollType);

	return details;
}

function translateRace(raceId) {
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

function extractGameDetails(jsonObject) {
	var firstStep = jsonObject.replay.replaystep[0];
	var lastStep = jsonObject.replay.replaystep[jsonObject.replay.replaystep.length - 1];

	//console.log(firstStep);
	//console.log(lastStep);

	return {
		replayfilename: lastStep.ruleseventgamefinished.matchresult.row.replayfilename,
		finished: lastStep.ruleseventgamefinished.matchresult.row.finished, // Looks inaccurate or wrong timezone
		stadiumName: firstStep.gameinfos.namestadium,
		stadiumType: firstStep.gameinfos.stadium,
		homeTeam: {
			coachName: firstStep.gameinfos.coachesinfos.coachinfos[0].userid,
			teamName: firstStep.boardstate.listteams.teamstate[0].data.name,
			race: translateRace(firstStep.boardstate.listteams.teamstate[0].data.idrace),
			score: lastStep.ruleseventgamefinished.matchresult.row.homescore || 0
		},
		awayTeam: {
			coachName: firstStep.gameinfos.coachesinfos.coachinfos[1].userid,
			teamName: firstStep.boardstate.listteams.teamstate[1].data.name,
			race: translateRace(firstStep.boardstate.listteams.teamstate[1].data.idrace),
			score: lastStep.ruleseventgamefinished.matchresult.row.awayscore || 0
		}
	};
}

function extractPlayerDetails(replayStep, playerDetails) {
	var teamStates = (((replayStep || {}).boardstate || {}).listteams || {}).teamstate;
	if (!teamStates || teamStates.length < 2) return;

	extractPlayerDetailsFromTeamState(teamStates[0], playerDetails);
	extractPlayerDetailsFromTeamState(teamStates[1], playerDetails);
}

function extractPlayerDetailsFromTeamState(teamState, playerDetails) {
	var players = ((teamState || {}).listpitchplayers || {}).playerstate;
	if (!players) return;

	for (var i=0; i < players.length; i++) {
		var player = players[i];
		if (!(player.id in playerDetails)) {
			playerDetails[player.id] = {
				id: player.id,
				idPlayerTypes: player.data.idplayertypes,
				skills: translateStringNumberList(player.data.listskills),
				name: player.data.name,
				number: player.data.number,
				ag: player.data.ag,
				av: player.data.av,
				ma: player.data.ma,
				st: player.data.st,
				teamId: player.data.teamid || 0
			};
		}
	}
}

var fileInput = document.getElementById("file-input");
fileInput.addEventListener('change', function() {
	zip.createReader(new zip.BlobReader(fileInput.files[0]), function (reader) {

		reader.getEntries(function (entries) {
			var lastPercentage;

			if (entries.length) {
				entries[0].getData(new zip.TextWriter(), function (text) {
					var jsonObject = textToJson(text);

					reader.close(function () {
						console.log("Zip file closed");
					});

					var gameDetails = extractGameDetails(jsonObject);
					console.log(gameDetails);

					playerDetails = {};
					storedDetails = [];
					for (var stepIndex = 0; stepIndex < jsonObject.replay.replaystep.length; stepIndex++) {
						var replayStep = jsonObject.replay.replaystep[stepIndex];
						extractPlayerDetails(replayStep, playerDetails);
						processReplayStep(stepIndex, replayStep);
					}
					console.log("Done storing results");
					console.log(playerDetails);
					console.table(storedDetails);

				}, function (current, total) {
					var percentage = parseInt(current / total * 100);
					if (percentage % 5 == 0 && (!lastPercentage || percentage != lastPercentage)) {
						console.log("Progress: " + percentage + "%");
						lastPercentage = percentage;
					}
				});
			}
		});
	}, function (error) {
		alert(error);
	});
});

/*
Below works and is simple, adapted from https://gildas-lormeau.github.io/zip.js/core-api.html#zip-reading-example
fileInput.addEventListener('change', function() {
	// use a BlobReader to read the zip from a Blob object
	zip.createReader(new zip.BlobReader(fileInput.files[0]), function (reader) {
		// get all entries from the zip
		reader.getEntries(function (entries) {
			if (entries.length) {
				// get first entry content as text
				entries[0].getData(new zip.TextWriter(), function (text) {
					// text contains the entry data as a String
					console.log(text);

					// close the zip reader
					reader.close(function () {
						// onclose callback
					});
				}, function (current, total) {
					// onprogress callback
				});
			}
		});
	}, function (error) {
		// onerror
		alert(error);
	});
});
*/

/*
// Below works but is complicated, adapted from https://gildas-lormeau.github.io/zip.js/demos/demo2.js
var model = (function() {
	var URL = window.webkitURL || window.mozURL || window.URL;

	return {
		getEntries : function(file, onend) {
			zip.createReader(new zip.BlobReader(file), function(zipReader) {
				zipReader.getEntries(onend);
			}, alert);
		},
		getEntryFile : function(entry, creationMethod, onend, onprogress) {
			var writer = new zip.BlobWriter();

			entry.getData(writer, function(blob) {
				console.log(blob);
				var blobURL = URL.createObjectURL(blob);
				onend(blobURL);
			}, onprogress);
		}
	};
})();

fileInput.addEventListener('change', function() {
	//fileInput.disabled = true;
	model.getEntries(fileInput.files[0], function(entries) {
		//fileList.innerHTML = "";
		entries.forEach(function(entry) {
			console.log(entry);

			model.getEntryFile(entry, "Blob", function(blobURL) {
				console.log(blobURL);
			}, function(current, total) {
				// Progress
			});
		});
	});
}, false);
*/