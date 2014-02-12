/*
 * Possible implementation of client side
 * The authentication part is as same as the process in authTest.js
 */

var net = require('net');
var crypto = require("crypto");
var constant = require('../constant');
var newsUtil = require('../newsUtil');
var pwdHashing = require('../pwdHashing');
/* Host and port of the server */
var HOST = '54.236.248.91';
var PORT = 1215;

var client = new net.Socket();

client.setEncoding('utf8');

client.connect(PORT, HOST, function() {
    console.log('CONNECTED TO: ' + HOST + ':' + PORT);
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.once('data', function(chunk) {
	var revObj = JSON.parse(chunk);
	var msgType = revObj.msgType;
	if (msgType == constant.token) {
		var token = revObj.content;
		var en_pwd = encryptPwd('testPwd1', token); // right one
		//var en_pwd = encryptPwd('testPwd', token);
		var userObj = {
			userName: 'testUser1',
			password: en_pwd
		};
		var json_str = newsUtil.generateMsg(constant.login, userObj);
		client.write(json_str);
		client.on('data', function(newChunk) {
			var revObj2 = JSON.parse(newChunk);
			var success = revObj2.content;
			if (success) {
				console.log('Log in Successfully!');
				client.write(newsUtil.generateMsg(constant.updateNow));
			} else {
				console.log('Log in Failed: Wrong user name or password.');
				client.destroy();
			}
		});
	} 
	else {
		console.log('[ERROR: undefined message type]');
	}
	
    //client.destroy();  
});

// Add a 'close' event handler for the client socket
client.on('close', function() {
    console.log('Connection closed');
});

/**
  * The function to encrypt the password with the given token
  * The algorithm is the same as the one in pwdHashing.js
  */
function encryptPwd(password, key) {
	var cipher = crypto.createCipher("aes256", key);
	var encrypted = cipher.update(password, 'utf8', 'base64') + cipher.final('base64');
	return encrypted;
}