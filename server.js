var net = require('net');
var crypto = require("crypto");
var MongoClient = require('mongodb').MongoClient;
var constant = require('./constant');
var pwdHashing = require('./pwdHashing');
var newsUtil = require('./newsUtil');
var router = require('./router');
var requestHandler = require('./requestHandler');

var HOST = '172.31.34.58';
var PORT = 1215;
/* host and port of the mongodb instance */
var DB_HOST = '172.31.47.131';
var DB_PORT = "27017";

// the handler for requests, used by the router
var handle = {};
handle[constant.update] = requestHandler.update;
handle[constant.logout] = requestHandler.logout;

net.createServer(function(socket) {
    socket.setEncoding('utf8');
    console.log('CONNECTED: ' + socket.remoteAddress +' : '+ socket.remotePort);
	var dbObj = null;
	var user_name = null;
	
	auth(socket, function(socket, db, userName){
		dbObj = db;
		user_name = userName;
		// login successfully
		// replace the event handler from handling authentication to handling requests
		socket.on('data', function(chunk) {
			var revObj = JSON.parse(chunk);
			// go to the router
			router.route(handle, socket, db, userName, revObj.msgType, revObj.content);
		});
	});
    
    socket.on('close', function(data) {
        // future use
    });

	socket.on('error', function(e) {
		if (e.code === "ECONNRESET") {
			if (dbObj) {
				dbObj.close();
			}
			if (user_name) {
				console.log(user_name + ' closed the connection');
			}
		} else {
			console.log(e);
		}
	});
    
}).listen(PORT, HOST);

console.log('Server started. listening on ' + HOST + ':' + PORT);

/**
  * Authenticate the login
  * socket: the connection stream
  * callback: the callback function after the authentication succeeds.
  *           it takes the socket, mongoDB object and the userName as arguments.
  */
function auth(socket, callback) {
	// generate the token
	crypto.randomBytes(128, function(e, randomKey) {
		var key = randomKey.toString('base64'); // use this encoded one to encrypt and decrypt
		socket.write(newsUtil.generateMsg(constant.token, key));

		socket.once('data', function(chunk) {
			// check if the client responsed with auth information
			var revObj = JSON.parse(chunk);
			var msgType = revObj.msgType;
			if (msgType != constant.login) {
				console.log('The message type: ' + msgType + ' is undefined.');
				socket.end();
				return;
			}
			var userObj = revObj.content;
			if (userObj == undefined) {
				// the response does not contain any auth information
				// or the returned auth information is abnormally too long
				// close the connection in case of possible malicious operations
				socket.end();
			} else {
				// check the database
				MongoClient.connect('mongodb://' + DB_HOST + ':' + DB_PORT + '/news', function(err, db) {
					var collection = db.collection('users');
					var userName = userObj.userName;
					collection.findOne({'userName':userName}, function(err, result) {
						if (result == null) {
							// not existing user
							socket.write(newsUtil.generateMsg(constant.login, false));
							socket.end();
							db.close();
						} else {
							// decrypt and get the password
							pwdHashing.decryptPwd(userObj.password, key, function(plainPwd){
								var salt = result.salt;
								pwdHashing.hashPwd(plainPwd, salt, function(hashedPwd) {
									if (hashedPwd == result.password) {
										// authenticate successfully
										console.log('User: ' + userName + ' log in successfully.');
										socket.write(newsUtil.generateMsg(constant.login, true));
										if (typeof(callback) === 'function') {
											callback(socket, db, userName);
										}
									} else {
										console.log('User: ' + userName + ' gave wrong password.');
										socket.write(newsUtil.generateMsg(constant.login, false));
										socket.end();
										db.close();
									}
								});
							});
						}
					});
				});
			}
		});
	});
}
