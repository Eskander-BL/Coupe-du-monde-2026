CREATE TABLE `confederations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `confederations_id` PRIMARY KEY(`id`),
	CONSTRAINT `confederations_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `groupStandings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` varchar(1) NOT NULL,
	`teamId` int NOT NULL,
	`wins` int NOT NULL DEFAULT 0,
	`draws` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`goalsFor` int NOT NULL DEFAULT 0,
	`goalsAgainst` int NOT NULL DEFAULT 0,
	`points` int NOT NULL DEFAULT 0,
	`position` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupStandings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`letter` varchar(1) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `groups_letter_unique` UNIQUE(`letter`)
);
--> statement-breakpoint
CREATE TABLE `matchAssists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int NOT NULL,
	`teamId` int NOT NULL,
	`goalId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchAssists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int NOT NULL,
	`teamId` int NOT NULL,
	`minute` int NOT NULL,
	`isOwnGoal` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchNumber` int NOT NULL,
	`homeTeamId` int NOT NULL,
	`awayTeamId` int NOT NULL,
	`homeGoals` int,
	`awayGoals` int,
	`matchDate` timestamp NOT NULL,
	`stadium` varchar(150),
	`city` varchar(100),
	`stage` enum('group','round32','round16','quarterfinal','semifinal','final','thirdplace') NOT NULL,
	`groupId` varchar(1),
	`status` enum('scheduled','live','completed') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`),
	CONSTRAINT `matches_matchNumber_unique` UNIQUE(`matchNumber`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`teamId` int NOT NULL,
	`position` enum('GK','DF','MF','FW') NOT NULL,
	`number` int,
	`goals` int NOT NULL DEFAULT 0,
	`assists` int NOT NULL DEFAULT 0,
	`minutesPlayed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`predictionType` enum('tournamentWinner','topScorer','bestPlayer') NOT NULL,
	`teamId` int,
	`playerId` int,
	`probability` decimal(5,2) NOT NULL,
	`reasoning` text,
	`rank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(3) NOT NULL,
	`name` varchar(100) NOT NULL,
	`confederationId` int NOT NULL,
	`groupId` varchar(1) NOT NULL,
	`flagUrl` text,
	`offensiveStrength` decimal(3,1),
	`defensiveStrength` decimal(3,1),
	`overallRating` decimal(3,1),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_code_unique` UNIQUE(`code`)
);
