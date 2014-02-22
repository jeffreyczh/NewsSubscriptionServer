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
	var urls_arr = []; // the urls of those RSS that need to be updated
	if (msgContent) {
		urls_arr = msgContent.urls;
	}
	// update all RSS
	collection.find({'userName': userName})
				.each(function(err, item) {
					if (item) {
						if (urls_arr.length == 0 || urls_arr.indexOf(item.url) != -1) {
							getRSS(item, function(returnedContent) {
							socket.write(newsUtil.generateMsg(constant.update, {'name': item.name, 'url': item.url, 'content': returnedContent, 'lastChecked': item.lastChecked}));
							collection.update({'userName': userName, 'url': item.url},
												item, {}, function(err) {
									if (err) {
										console.log('[ERROR]: Fail to update: ' + err);
									}
								});
							});
						}
						
					} else {
						// no more RSS items
					}
				});
}

/**
  * Add a new RSS
  * If the RSS has already existed, which there is a RSS with the same url, it will be replaced by the new one
  */
function add(socket, db, userName, msgContent) {
	var collection = db.collection('favs');
	var RSSObjs = msgContent;
	for (var i = 0, max = RSSObjs.length; i < max; i++) {
		var RSSObj = RSSObjs[i];
		// complete fields
		RSSObj.userName = userName;
		RSSObj.lastModified = '';
		RSSObj.md5 = '';
		RSSObj.lastChecked = '';
		collection.findAndModify(
			{'userName': userName, 'url': RSSObj.url}, 
			null, 
			RSSObj,
			{'upsert': true},
			function(err, object) {
				if (err) {
					socket.write(newsUtil.generateMsg(constant.add, {'result': false, 'errorMsg': err.message}));
				} else {
					socket.write(newsUtil.generateMsg(constant.add, {'result': true, 'errorMsg': ''}));
				}
			}
		);
	}
}

/**
  * Modify an existing RSS
  * An error message will be sent if the RSS does not exist
  */
function modify(socket, db, userName, msgContent) {
	var collection = db.collection('favs');
	var RSSObjs = msgContent;
	for (var i = 0, max = RSSObjs.length; i < max; i++) {
		var RSSObj = RSSObjs[i];
		collection.findAndModify(
			{'userName': userName, 'url': RSSObj.url}, 
			null, 
			{$set: RSSObj},
			{},
			function(err, object) {
				if (err) {
					// maybe no matching object is found
					socket.write(newsUtil.generateMsg(constant.add, {'result': false, 'errorMsg': err.message}));
				} else {
					socket.write(newsUtil.generateMsg(constant.add, {'result': true, 'errorMsg': ''}));
				}
			}
		);
	}
}



/**
  * Add\modify\remove a RSS
  */
function remove(socket, db, userName, msgContent) {
	var collection = db.collection('favs');
	var RSSObjs = msgContent;
	for (var i = 0, max = RSSObjs.length; i < max; i++) {
		var RSSObj = RSSObjs[i];
		collection.findAndModify(
			{'userName': userName, 'url': RSSObj.url}, 
			null, 
			{},
			{'remove': true},
			function(err, object) {
				if (err) {
					socket.write(newsUtil.generateMsg(constant.add, {'result': false, 'errorMsg': err.message}));
				} else {
					socket.write(newsUtil.generateMsg(constant.add, {'result': true, 'errorMsg': ''}));
				}
			}
		);
	}
}

/**
  * Gets one RSS
  * item: one of the RSS items from the database
  * callback: the callback function that holds the RSS content as the argument
  *           if the returned content is null, the RSS doesn't has any update
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
			var date = new Date();
			item.lastChecked = date.toUTCString();
			var total = '';
			if (isUpdated) {
				// encode the response text
				var buff = bufferHelper.toBuffer();
				// check the charset for the further encoding
				total = iconv.decode(bufferHelper.toBuffer(),'utf-8');
				var charset = total.match(/xml version=.+encoding=\"(.+)\"/);
				if (charset == null) {
					charset = 'utf-8';
				} else {
					charset = charset[1];
				}
				if (charset != 'utf-8') {
					total = iconv.decode(bufferHelper.toBuffer(),charset);
				}
			}
			if (typeof(callback) === 'function') {
				callback(total);
			}
		});
	});
}

exports.update = update;
exports.add = add;
exports.modify = modify;
exports.remove = remove;