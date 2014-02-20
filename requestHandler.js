/**
  * Handlers for the requests
  */
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var bufferhelper = require('bufferhelper');
var iconv = require('iconv-lite');
var newsUtil = require('./newsUtil');
var constant = require('./constant');
/**
  * Updates RSS for the user
  * if the msgContent is empty/null/undefined, update all RSS
  * otherwise update the RSS specified by the msgContent
  */
function update(socket, db, userName, msgContent) {
	var collection = db.collection('favs');
	if (msgContent) {
	} else {
		// update all RSS
		collection.find({'userName': userName})
					.each(function(err, item) {
						if (item) {
							getRSS(item, function(modifiedItem, returnedContent) {
								collection.update({'userName': userName, 'url': item.url},
												   item, {}, function(err) {
									if (err) {
										console.log('[ERROR]: Fail to update: ' + err);
									}
								});
								socket.write(newsUtil.generateMsg(constant.update, {'url': item.url, 'content': returnedContent}));
							});
						} else {
							// no more RSS items
						}
					});
	}
}

function logout(socket, db) {
	socket.end();
	db.close();
}
/**
  * Gets one RSS
  * item: one of the RSS items from the database
  * callback: the callback function that holds the modified item and RSS content as arguments
  */
function getRSS(item, callback) {
	var urlObj = url.parse(item.url);
	var options = {
		host: urlObj.host,
		path: urlObj.path,
		headers: {
			'If-Modified-Since': item.lastModified
		}
	};
	http.get(options, function(res) {
		console.log('GET from ' + item.url + ' -------');
		console.log('code: ' + res.statusCode);
		var md5sum = '';
		var lm = res.headers['last-modified'];
		if (lm == undefined) {
			// the response header does not contain the 'last-modified' field
			// hash the content for further comparison
			md5sum = crypto.createHash('md5');

		}
		var bufferHelper = new bufferhelper();
		res.on('data', function(chunk){
			bufferHelper.concat(chunk);
			if (lm == undefined) {
				// the response header does not contain the 'last-modified' field
				// hash the content for further comparison
				md5sum.update(chunk);
			}
		}).on('end', function(){
			var isUpdated = false;
			if (lm == undefined) {
				// the response header does not contain the 'last-modified' field
				// hash the content for further comparison
				var hashValue = md5sum.digest('hex');
				if (hashValue != item.md5) {
					item.md5 = hashValue;
					isUpdated = true;
				}
			} else {
				if (lm != item.lastModified) {
					item.lastModified = lm;
					isUpdated = true;
				}
			}
			if (isUpdated) {
				// encode the response text
				var buff = bufferHelper.toBuffer();
				// check the charset for the further encoding
				var total = iconv.decode(bufferHelper.toBuffer(),'utf-8');
				var charset = total.match(/xml version=.+encoding=\"(.+)\"/);
				if (charset == null) {
					charset = 'utf-8';
				} else {
					charset = charset[1];
				}
				if (charset != 'utf-8') {
					total = iconv.decode(bufferHelper.toBuffer(),charset);
				}
				var date = new Date();
				item.lastUpdated = date.toUTCString();
				if (typeof(callback) === 'function') {
					callback(item, total);
				}
			}
		});
	});
}

exports.update = update;
exports.logout = logout;