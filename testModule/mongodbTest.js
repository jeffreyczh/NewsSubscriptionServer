var MongoClient = require('mongodb').MongoClient;

var DB_HOST = '172.31.47.131';
var DB_PORT = "27017";

MongoClient.connect('mongodb://' + DB_HOST + ':' + DB_PORT + '/news', function(err, db) {
	var collection = db.collection('users');
	collection.findOne({'userName':'testUser'}, function(err, result) {
		console.log('password: ' + result.password);
		console.log('salt: ' + result.salt);
	});
	/*var collection = db.collection('favs');
	collection.findAndModify(
		{'userName':'testUser1', 'url': 'http://news.qq.com/newsgn/rss_newsgn.xml'}, 
		null, 
		{$set: {'name': 'Tencent News'}},
		{'new': true, 'upsert': true},
		function(err, object) {
			console.log('return: ' + object);
	});*/
	
});