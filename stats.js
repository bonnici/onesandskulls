// TODO
// separate rolls by team (duh)
// roll type 3, 4, -1

stats = {
	calculateStats: function(actions) {
		//var stats = { "1db": { total: 10, histogram: {"1": 9, "2": 1 } } };
		var stats = {
			"standard": { diceType: 1, total: 0, histogram: [0,0,0,0,0,0] },
			"scatter":  { diceType: 2, total: 0, histogram: [0,0,0,0,0,0,0,0] },
			"block":    { diceType: 0, total: 0, histogram: [0,0,0,0,0] },
			"1db":      { diceType: 0, total: 0, histogram: [0,0,0,0,0] },
			"2db":      { diceType: -1, total: 0, histogram: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] }
		};

		for (var i=0; i < actions.length; i++) {
			var action = actions[i];

			var rollType = action.rollType;

			if (ignoreRollType(rollType)) {
				continue;
			}

			var diceType = rollTypeIdToDiceType(rollType);
			for (var j=0; j < action.dice.length; j++) {
				var die = action.dice[j];
				var statsToUpdate;
				if (diceType == 0) {
					statsToUpdate = stats["block"];
				}
				else if (diceType == 1) {
					die--;
					statsToUpdate = stats["standard"];
				}
				else if (diceType == 2) {
					die--;
					statsToUpdate = stats["scatter"];
				}

				if (statsToUpdate) {
					statsToUpdate.total++;
					statsToUpdate.histogram[die]++;
				}
			}

			if (diceType == 0) {
				if (action.dice.length == 1) {
					var die = action.dice[0];
					stats["1db"].total++;
					stats["1db"].histogram[die]++;
				}
				else if (action.dice.length == 2) {
					var die = (action.dice[0] * 5) + action.dice[1];
					stats["2db"].total++;
					stats["2db"].histogram[die]++;
				}
			}
			else {
				if (action.dice.length > 1) {
					console.log("OOPS - skipping action with valid rollType " + rollType);
					console.log(action);
				}
				else {
					initStats(stats, rollType);

					var die = action.dice[0] - 1;
					stats[rollType].total++;
					stats[rollType].histogram[die]++;
				}
			}
		}

		return stats;
	}
};

function ignoreRollType(rollType) {
	var diceType = rollTypeIdToDiceType(rollType);

	// For now just do standard rolls, need to work out what to do with special rolls
	return diceType === null || diceType > 2;
}

function initStats(stats, rollType) {
	if (rollType in stats) {
		return;
	}

	var diceType = rollTypeIdToDiceType(rollType);
	if (diceType == 1) {
		stats[rollType] = {total: 0, diceType: 1, histogram: [0,0,0,0,0,0]};
	}
	else if (diceType == 2) {
		stats[rollType] = {total: 0, diceType: 2, histogram: [0,0,0,0,0,0,0,0]};
	}
}

function rollTypeIdToDiceType(rollType) {
	/*
	Types:
	-1 = 2DB
	0 = Block dice (5-sided, push is just twice as likely)
	1 = Standard (6 sided)
	2 = Scatter (8 sided)
	3 = Armor (2x 6 sided?) - 6x6 array
	4 = Injury (2x 6 sided?) - group by injury type
	5 = Casualty (6 sided (10s) + 8 sided (1s)) - group by cas type
	6 = Kickoff (8 sided (direction) + 6 sided (distance)) - have 2 separate entries for this, group scatter roll with other scatters
	7 = Kickoff Scatter (2x 6 sided) - separate into 2 separate scatter rolls
	*/
	switch (rollType) {
		case -2: return 7;
		case -1: return 6;
		case 1: return 1;
		case 2: return 1;
		case 3: return 3;
		case 4: return 4;
		case 5: return 0;
		case 6: return 1;
		case 7: return 1;
		case 8: return 5;
		case 9: return 1;
		case 10: return 2;
		case 11: return null; // Throw-in (2x 6 sided?), skip it
		case 12: return 1;
		case 16: return 1;
		case 17: return 1;
		case 20: return 1;
		case 21: return 1;
		case 22: return 1;
		case 23: return 1;
		case 24: return 1;
		case 26: return null; // Inaccurate pass - not sure what to do with this
		case 29: return 1;
		case 27: return 1;
		case 31: return 1;
		case 34: return null; // Stab, not sure what to do
		case 36: return 1;
		case 37: return 1;
		case 40: return 1;
		case 42: return 1;
		case 46: return 1;
		case 54: return 1;
		case 55: return 1;
		case 56: return 1;
		case 58: return 2;
		default: return null;
	}
}