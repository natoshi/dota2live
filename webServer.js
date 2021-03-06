var	express = require('express'),
	app = express(),
	MongoClient = require("mongodb").MongoClient;
	url = require('url');

	app.set("views", __dirname + "/views");
	app.set("view engine", "jade");
	app.use("/stylesheets", express.static(__dirname + '/stylesheets'));
	app.use("/js", express.static(__dirname + '/js'));
	app.use("/images", express.static(__dirname + '/images'));


	
MongoClient.connect("mongodb://localhost:27017/dota2", function(err, db) {

	if (err) {
		throw err;
	};
	Collections = {};
	Collections.Games = db.collection("games");

	var steamId = "";
	var heroId = "";
	var steamName = "";

	app.use(function(request, response, next) {
		response.locals.steamId = steamId;
		response.locals.heroId = heroId;
		response.locals.steamName = steamName;
		next();
	});

	app.get('/', function(req, res){
		steamId = "";
		heroId = "";
		steamName = "";

		a = url.parse(req.url, true);
		var page = 1;
		if (a.query.page) {
			if (a.query.page > 0) {
				page = a.query.page;
			};
		};

		Collections.Games.find().toArray(function(err, pages) {
			if (err) {
				return console.error(err);
			};

			res.render("index", {games: pages[pages.length - 1].pages[page-1], page : page, pages:pages}, function(err, html) {
				if (err) {
					console.error(err);
				};

				res.send(html);
			});

		});

	});

	function findBySteamId(data, steamId){
		var pages = data;

		for (var i = 0; i < pages.length; i++) {
			for (var q = 0; q < pages[i].games.length; q++) {
				for (var w = 0; w < pages[i].games[q].goodPlayers.length; w++) {

					if (pages[i].games[q].goodPlayers[w].steamId == steamId ) {
						return pages[i].games[q];
					};

					if (pages[i].games[q].badPlayers[w]) {
						if (pages[i].games[q].badPlayers[w].steamId == steamId ) {
							return pages[i].games[q];
						}
					};
				};
			};
		};
	}

	function findByHeroId(data, heroId){
		var pages = data;
		var gameNum = 0;
		var gamesFound = [];

		for (var i = 0; i < pages.length; i++) {
			for (var q = 0; q < pages[i].games.length; q++) {
				for (var w = 0; w < pages[i].games[q].goodPlayers.length; w++) {

					if (pages[i].games[q].goodPlayers[w].heroId == heroId ) {
						gamesFound[gameNum] = pages[i].games[q];
						gameNum++;
					};

					if (pages[i].games[q].badPlayers[w]) {
						if (pages[i].games[q].badPlayers[w].heroId == heroId ) {
							gamesFound[gameNum] = pages[i].games[q];
							gameNum++;
						}
					};
				};
			};
		};

		return gamesFound;
	}


	function findByName(data, name){
		var pages = data;

		for (var i = 0; i < pages.length; i++) {
			for (var q = 0; q < pages[i].games.length; q++) {
				for (var w = 0; w < pages[i].games[q].goodPlayers.length; w++) {

					if (pages[i].games[q].goodPlayers[w].name == name ) {
						return pages[i].games[q];
					};

					if (pages[i].games[q].badPlayers[w]) {
						if (pages[i].games[q].badPlayers[w].name == name ) {
							return pages[i].games[q];
						}
					};
				};
			};
		};
	}


	app.get('/search/', function(req, res){
		Collections.Games.find().toArray(function(err, pages) {
			if (err) {
				return console.error(err);
			};

			var games = pages[pages.length - 1].pages;

			if (req.query.steamId) {
				gamesFound = [findBySteamId(games, req.query.steamId)];
				steamId = req.query.steamId;
			}else if (req.query.heroId) {
				gamesFound = findByHeroId(games, req.query.heroId);
				heroId = req.query.heroId;
			}else if(req.query.name){
				gamesFound = [findByName(games, req.query.name)];
				steamName = req.query.name;
			}
			
			gamesFound = [{"gamesFound" : gamesFound.length}, gamesFound];

			if (req.query.json) {	

				res.json(
					gamesFound
				);

			}else{
				res.render("index", {gamesFound: gamesFound, pages:pages, steamId: steamId, heroId: heroId, steamName : steamName}, function(err, html) {
					if (err) {
						console.error(err);
					};

					res.send(html);
				});
			}


		});
	});

});

app.listen(1111);