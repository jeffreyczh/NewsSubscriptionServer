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
var HOST = '54.85.105.161';
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
		var totalData = '';
		client.on('data', function(newChunk) {
			
			try {
				totalData += newChunk;
				var revObj2 = JSON.parse(totalData);
				// handle responses based on the message type
				if (revObj2.msgType == constant.login) {
					var success = revObj2.content;
					if (success) {
						console.log('Log in Successfully!');
						// update all RSS
						//client.write(newsUtil.generateMsg(constant.update));
						// update some of the RSS
						//client.write(newsUtil.generateMsg(constant.update, 
						//			{urls: ['http://www.developer-tech.com/feed/', 'http://news.qq.com/newsgn/rss_newsgn.xml']}));
						// add new RSS
						//client.write(newsUtil.generateMsg(constant.add, 
						//						[{'url': 'http://www.chinanews.com/rss/scroll-news.xml', 'name': 'China News'},
						//						 {'url': 'http://news.ifeng.com/rss/index.xml', 'name': ''},
						//                         {'url': 'http://www.developer-tech.com/feed/', 'name': 'Developer News'}]));
						//client.write(newsUtil.generateMsg(constant.add, 
						//						[{'url': 'http://news.ifeng.com/rss/index.xml', 'name': ''}]));
						// modify RSS
						//client.write(newsUtil.generateMsg(constant.modify, 
						//						[{'url': 'http://www.chinanews.com/rss/scroll-news.xml', 'name': 'Chinese News'},
						//						 {'url': 'http://news.ifeng.com/rss/index.xml', 'name': 'ifeng News'}])); 
						//client.write(newsUtil.generateMsg(constant.modify, 
						//						[{'url': 'http://news.ifeng.com/rss/index.xml', 'name': 'ifeng News'}])); 
						// remove a RSS
						//client.write(newsUtil.generateMsg(constant.remove, 
						//						[{'url': 'http://news.ifeng.com/rss/index.xml'}])); 
						// turn on/off notification pushing
						/*setTimeout(function () {
								client.write(newsUtil.generateMsg(constant.push, false));
								console.log("Turn off");
							}, 500);
						setTimeout(function () {
								client.write(newsUtil.generateMsg(constant.push, true));
								console.log("Turn on");
							}, 180000);*/
						
					} else {
						console.log('Log in Failed: Wrong user name or password.');
						client.destroy();
					}
				} else if (revObj2.msgType == constant.update) {
					var RSSItem = revObj2.content;
					// simply display the update here, you may develop GUI to show those updates
					console.log(RSSItem.name + ' --- ' + RSSItem.url + ": ");
					console.log(RSSItem.content);
					console.log('Last Checked: ' + RSSItem.lastChecked);
					console.log('---------------------------------------------------');
					
				} else if (revObj2.msgType == constant.add) {
					console.log('success?: ' + revObj2.content.result);
					console.log('error msg?: ' + revObj2.content.errorMsg);
				} else if (revObj2.msgType == constant.modify) {
					console.log('success?: ' + revObj2.content.result);
					console.log('error msg?: ' + revObj2.content.errorMsg);
				} else if (revObj2.msgType == constant.remove) {
					console.log('success?: ' + revObj2.content.result);
					console.log('error msg?: ' + revObj2.content.errorMsg);
				} else if (revObj2.msgType == constant.push) {
					console.log('success?: ' + revObj2.content.result);
					console.log('error msg?: ' + revObj2.content.errorMsg);
				} else {
					console.log('Unknown message type: ' + revObj2.msgType);
				}
				totalData = '';
			}
			catch (e) {
				if (e.name != 'SyntaxError') {
					console.log('[ERROR]: ' + e);
					totalData = '';
				}
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