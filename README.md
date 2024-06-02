# POKER-IO

A site that contains Poker, Blackjack, Roulette.
Made using express-js and Socket io

 SQL for table creation   

        CREATE TABLE "tblAccounts" (
        	"AccountID"	INTEGER,
        	"Username"	TEXT,
        	"Password"	TEXT,
        	PRIMARY KEY("AccountID")
        );
    
        CREATE TABLE "tblEarnings" (
        	"EarningsID"	INTEGER,
        	"AccountID"	INTEGER,
        	"PokerEarnings"	INTEGER,
        	"BlackjackEarnings"	INTEGER,
        	"RouletteEarnings"	INTEGER,
        	FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID"),
        	PRIMARY KEY("EarningsID")
        );
    
    CREATE TABLE "tblPreferences" (
    	"PreferenceID"	INTEGER,
    	"AccountID"	INTEGER,
    	"Theme"	TEXT,
    	"ImagePath"	TEXT,
    	FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID"),
    	PRIMARY KEY("PreferenceID")
    );
    CREATE TABLE "tblSession" (
    	"PKSessionID"	INTEGER,
    	"SessionID"	INTEGER,
    	"AccountID"	INTEGER,
    	"Stayloggedin"	INTEGER CHECK("Stayloggedin" IN (0, 1)),
    	"ExpireryDate"	TEXT,
    	FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID"),
    	PRIMARY KEY("PKSessionID")
    );
    CREATE TABLE "tblUsedIPs" (
    	"IPID"	INTEGER,
    	"AccountID"	INTEGER,
    	"IP"	TEXT,
    	UNIQUE("AccountID","IP"),
    	PRIMARY KEY("IPID"),
    	FOREIGN KEY("AccountID") REFERENCES "tblAccounts"("AccountID")
    );
