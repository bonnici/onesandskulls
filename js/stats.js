stats = {
	calculateStats: function(actions) {
		var stats = {
			"standard": { diceType: 1,  0: { total: 0, histogram: [0,0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0,0] }, expected: [1.0/6,1.0/6,1.0/6,1.0/6,1.0/6,1.0/6] },
			"scatter":  { diceType: 2,  0: { total: 0, histogram: [0,0,0,0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0,0,0,0] }, expected: [1.0/8,1.0/8,1.0/8,1.0/8,1.0/8,1.0/8,1.0/8,1.0/8] },
			"block":    { diceType: 0,  0: { total: 0, histogram: [0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0] }, expected: [1.0/6,1.0/6,2.0/6,1.0/6,1.0/6,1.0/6] },
			"1db":      { diceType: 0,  0: { total: 0, histogram: [0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0] }, expected: [1.0/6,1.0/6,2.0/6,1.0/6,1.0/6,1.0/6] },
			"2db":      { diceType: -1, 0: { total: 0, histogram: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] }, expected: [1.0/36,2.0/36,4.0/36,2.0/36,2.0/36,1.0/36,4.0/36,2.0/36,2.0/36,4.0/36,4.0/36,4.0/36,1.0/36,2.0/36,1.0/36] },
			"armour":   { diceType: 3,  0: { total: 0, histogram: [0,0,0,0,0,0,0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0,0,0,0,0,0,0] }, expected: [1.0/36,2.0/36,3.0/36,4.0/36,5.0/36,6.0/36,5.0/36,4.0/36,3.0/36,2.0/36,1.0/36] },
			"injury":   { diceType: 4,  0: { total: 0, histogram: [0,0,0] }, 1: { total: 0, histogram: [0,0,0] }, expected: [21.0/36,9.0/36,6.0/36] },
			"casualty": { diceType: 5,  0: { total: 0, histogram: [0,0,0,0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0,0,0,0] }, expected: [0.5,1.0/6,2.0/48,2.0/48,2.0/48,1.0/48,1.0/48,1.0/6]  }
		};

		for (var i=0; i < actions.length; i++) {
			var action = actions[i];

			var rollType = action.rollType;

			if (ignoreRollType(rollType)) {
				if (rollTypeIdToDiceType(rollType) == null) {
					//console.log("Ignoring roll " + rollType);
					//console.log(action);
				}
				continue;
			}

			var diceType = rollTypeIdToDiceType(rollType);

			// Sum up armor rolls
			if (diceType == 3) {
				var total = 0;
				for (var j=0; j < action.dice.length; j++) {
					total += (action.dice[j] - 1);
				}
				stats["armour"][action.team].total++;
				stats["armour"][action.team].histogram[total]++;
			}
			// Sum up and group injury rolls
			else if (diceType == 4) {
				var result = injuryDiceToResult(action.dice);
				if (result !== null) {
					stats["injury"][action.team].total++;
					stats["injury"][action.team].histogram[result]++;
				}
			}
			// Sum up and group casualty rolls
			else if (diceType == 5) {
				var result = casualtyDiceToResult(action.dice);
				if (result !== null) {
					stats["casualty"][action.team].total++;
					stats["casualty"][action.team].histogram[result]++;
				}
			}
			else {
				for (var j = 0; j < action.dice.length; j++) {
					var die = action.dice[j];
					var statsToUpdate;
					if (diceType == 0) {
						statsToUpdate = stats["block"][action.team];
					}
					else if (diceType == 1 || diceType == 7) {
						die--;
						statsToUpdate = stats["standard"][action.team];
					}
					else if (diceType == 2) {
						die--;
						statsToUpdate = stats["scatter"][action.team];
					}

					if (statsToUpdate) {
						statsToUpdate.total++;
						statsToUpdate.histogram[die]++;
					}
				}
			}

			if (diceType == 0) {
				if (action.dice.length == 1) {
					var die = action.dice[0];
					stats["1db"][action.team].total++;
					stats["1db"][action.team].histogram[die]++;
				}
				else if (action.dice.length == 2) {
					var smallest = Math.min(action.dice[0], action.dice[1]);
					var biggest = Math.max(action.dice[0], action.dice[1]);
					var adjustment = 0;
					for (var k=smallest; k > 0; k--) { adjustment += k; }
					var die = (smallest * 5) + biggest - adjustment;
					stats["2db"][action.team].total++;
					stats["2db"][action.team].histogram[die]++;
				}
			}
			else if (diceType == 1) {
				if (action.dice.length > 1) {
					console.log("OOPS - skipping action with valid rollType " + rollType);
					console.log(action);
				}
				else {
					initStats(stats, rollType);

					var die = action.dice[0] - 1;
					stats[rollType][action.team].total++;
					stats[rollType][action.team].histogram[die]++;
				}
			}
		}

		return stats;
	}
};

function injuryDiceToResult(dice) {
	if (dice.length != 2) {
		console.log("OOPS - wrong number of dice for injury roll");
		console.log(dice);
		return null;
	}

	var total = dice[0] + dice[1];
	if (total < 8) {
		return 0; // Stunned
	} else if (total < 10) {
		return 1; // KO
	} else {
		return 2; // Casualty
	}
}

function casualtyDiceToResult(dice) {
	if (dice.length != 1) {
		console.log("OOPS - wrong number of dice for casualty roll");
		console.log(dice);
		return null;
	}

	if (dice[0] <= 38) {
		return 0; // No long term effect
	} else if (dice[0] <= 48) {
		return 1; // MNG
	} else if (dice[0] <= 52) {
		return 2; // Niggling
	} else if (dice[0] <= 54) {
		return 3; // -1 MA
	} else if (dice[0] <= 56) {
		return 4; // -1 AV
	} else if (dice[0] <= 57) {
		return 5; // -1 AG
	} else if (dice[0] <= 58) {
		return 6; // -1 ST
	} else {
		return 7; // Dead
	}
}

function ignoreRollType(rollType) {
	var diceType = rollTypeIdToDiceType(rollType);
	return diceType === null || diceType == 6;
}

function initStats(stats, rollType) {
	if (rollType in stats) {
		return;
	}

	var diceType = rollTypeIdToDiceType(rollType);
	if (diceType == 1) {
		stats[rollType] = { diceType: 1, expected: [1.0/6,1.0/6,1.0/6,1.0/6,1.0/6,1.0/6], 0: { total: 0, histogram: [0,0,0,0,0,0] }, 1: { total: 0, histogram: [0,0,0,0,0,0] } };
	}
}

function rollTypeIdToDiceType(rollType) {
	/*
	Types:
	-1 = 2DB
	0 = Block dice (5-sided, push is just twice as likely)
	1 = Standard (6 sided)
	2 = Scatter (8 sided)
	3 = Armour (2x 6 sided)
	4 = Injury (2x 6 sided)
	5 = Casualty (6 sided (10s) + 8 sided (1s))
	6 = Kickoff (8 sided (direction) + 6 sided (distance)) - not worth grouping
	7 = Throw-in (2x 6 sided)
	*/
	switch (rollType) {
		case -2: return 2;
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
		case 11: return 7;
		case 12: return 1;
		case 16: return 1;
		case 17: return 1;
		case 20: return 1;
		case 21: return 1;
		case 22: return 1;
		case 23: return 1;
		case 24: return 1;
		case 26: return 2;
		case 29: return 1;
		case 27: return 1;
		case 31: return 1;
		case 34: return 3;
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