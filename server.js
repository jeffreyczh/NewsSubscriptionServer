var net = require('net');
var crypto = require("crypto");
var MongoClient = require('mongodb').MongoClient;
var constant = require('./constant');
var pwdHashing = require('./pwdHashing');
var newsUtil = require('./newsUtil');
var HOST = '172.31.34.58';
var PORT = 1215;
/* host and port of the mongodb instance */
var DB_HOST = '172.31.47.131';
var DB_PORT = "27017";

net.createServer(function(socket) {
    socket.setEncoding('utf8');
    console.log('CONNECTED: ' + socket.remoteAddress +' : '+ socket.remotePort);
	
	auth(socket, function(){});
    
    socket.on('close', function(data) {
        // future use
    });

	socket.on('error', function(e) {
		console.log(e);
	});
    
}).listen(PORT, HOST);

console.log('Server started. listening on ' + HOST + ':' + PORT);

/**
  * Authenticate the login
  * socket: the connection stream
  * callback: the callback function after the authentication succeeds
  */
function auth(socket, callback) {
	// generate the token
	crypto.randomBytes(128, function(e, randomKey) {
		var key = randomKey.toString('base64'); // use this encoded one to encrypt and decrypt
		socket.write(constant.token + key + constant.endOfData);

		socket.on('data', function(chunk) {
			// check if the client responsed with auth information
			var authInfo = newsUtil.getContent(chunk, constant.token);
			if (authInfo == undefined) {
				// the response does not contain any auth information
				// or the returned auth information is abnormally too long
				// close the connection in case of possible malicious operations
				socket.end();
			} else {
				// decode the auth string back to json object
				var userObj = JSON.parse(authInfo);
				// check the database
				MongoClient.connect('mongodb://' + DB_HOST + ':' + DB_PORT + '/news', function(err, db) {
					var collection = db.collection('users');
					collection.findOne({'userName':userObj.userName}, function(err, result) {
						if (result == null) {
							// not existing user
							socket.end();
						} else {
							// decrypt and get the password
							pwdHashing.decryptPwd(userObj.password, key, function(plainPwd){
								var salt = result.salt;
								pwdHashing.hashPwd(plainPwd, salt, function(hashedPwd) {
									if (hashedPwd == result.password) {
										// authenticate successfully
										console.log('User: ' + userObj.userName + ' log in successfully.');
										if (typeof(callback) === 'function') {
											callback();
										}
									} else {
										console.log('User: ' + userObj.userName + ' gave wrong password.');
										socket.end();
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
