/**
  * Contains functions to operate RSS and database
  */
var http = require('http');
var url = require('url');
var crypto = require('crypto');
var bufferhelper = require('bufferhelper');
var iconv = require('iconv-lite');
var newsUtil = require('./newsUtil');
var constant = require('./constant');

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
				// also set the last-modified timestamp to indicate when is the
				// last time that "I saw" the update
				var hashValue = md5sum.digest('hex');
				if (hashValue != item.md5) {
					item.md5 = hashValue;
					item.lastModified = new Date().toUTCString();
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

/**
  * Go and get update of the RSS source
  * as well as update the RSS item in the database
  * db: the mongoDB object
  * userName: the user name of the current user
  * urls_arr: the array list of urls
  * callback: callback function when the update of one RSS is obtained. 
  *			  The first param is the RSS item before being updated
  *           The second param is the updated RSS item
  *           The third param is the content of the RSS. Can be an empty string if there is no update.
  */
function getRSSUpdate(db, userName, urls_arr, callback) {
	var collection = db.collection('favs');
	collection.find({'userName': userName})
					.each(function(err, item) {
						if (item) {
							// update all rss if the requesting array is empty
							if (urls_arr.length == 0 || urls_arr.indexOf(item.url) != -1) {
								var oldItem = newsUtil.objClone(item);
								getRSS(item, function(returnedContent) {
									collection.update({'userName': userName, 'url': item.url},
														item, 
														{}, 
														function(err) {
															if (err) {
																console.log('[ERROR]: Fail to update: ' + err);
															}
														}
									);
									if (typeof(callback) === 'function') {
										callback(oldItem, item, returnedContent);
									}
								});
							}
						}
					}
	);
}

/**
  * Add a new RSS
  * If the RSS has already existed, which there is a RSS with the same url, it will be replaced by the new one
  * rssObj: the object contains the url and the name of the RSS
  * callback: the callback function when operation completes (not necessarily complete successfully).
  *           The first param is the error object if fail to add the RSS to the database. Null if succeed
  *           The second param is the updated RSS item. Null if fail
  */
function addRSS(db, userName, rssObj, callback) {
	var collection = db.collection('favs');
	// complete fields
	rssObj.userName = userName;
	rssObj.lastModified = '';
	rssObj.md5 = '';
	rssObj.lastChecked = '';
	collection.findAndModify(
		{'userName': userName, 'url': rssObj.url}, 
		null, 
		rssObj,
		{'upsert': true},
		function (err, object) {
			callback(err, object);
		}
	);
}

function removeRSS(db, userName, rssObj, callback) {
	var collection = db.collection('favs');
	collection.findAndModify(
		{'userName': userName, 'url': rssObj.url}, 
		null, 
		{},
		{'remove': true},
		function(err, object) {
			callback(err, object);
		}
	);
}

function modifyRSS(db, userName, rssObj, callback) {
	var collection = db.collection('favs');
	collection.findAndModify(
		{'userName': userName, 'url': rssObj.url}, 
		null, 
		{$set: rssObj},
		{},
		function(err, object) {
			callback(err, object);
		}
	);
}

/**
  * Initialize and begin the process of notification pushing
  */
function startPushing(pushConfig, db, userName) {
	pushConfig.push = true;
	getRSSUpdate(db, userName, [], 
				 function(oldItem, item, returnedContent) {
					
				 }
	);
}


exports.getRSSUpdate = getRSSUpdate;
exports.addRSS = addRSS;
exports.removeRSS = removeRSS;
exports.modifyRSS = modifyRSS;
exports.startPushing = startPushing;