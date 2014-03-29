/**
  * Handlers for the requests
  */
var newsUtil = require('./newsUtil');
var constant = require('./constant');
var rssOp = require('./rssOp');
/**
  * Updates RSS for the user
  * if the msgContent is empty/null/undefined, update all RSS
  * otherwise update the RSS specified by the msgContent
  */
function update(socket, db, userName, msgContent) {
	var urls_arr = []; // the urls of those RSS that need to be updated
	if (msgContent) {
		urls_arr = msgContent.urls;
	}
	rssOp.getRSSUpdate(db, userName, urls_arr, 
					   function(oldItem, item, returnedContent) {
							socket.write(newsUtil.generateMsg(constant.update, 
															  {'name': item.name, 'url': item.url, 'content': returnedContent, 'lastChecked': item.lastChecked}));
					   }
	);
}

/**
  * Add a new RSS
  * If the RSS has already existed, which there is a RSS with the same url, it will be replaced by the new one
  */
function add(socket, db, userName, pushConfigObj, msgContent) {
	var collection = db.collection('favs');
	var rssObjs = msgContent;
	for (var i = 0, max = rssObjs.length; i < max; i++) {
		var rssObj = rssObjs[i];
		rssOp.addRSS(db, userName, rssObj,
			        function(err, object) {
						if (err) {
							socket.write(newsUtil.generateMsg(constant.add, {'result': false, 'errorMsg': err.message}));
						} else {
							socket.write(newsUtil.generateMsg(constant.add, {'result': true, 'errorMsg': ''}));
						}
					}
		);
		pushConfigObj.add(rssObj.url);
	}
}

/**
  * Modify an existing RSS
  * An error message will be sent if the RSS does not exist
  */
function modify(socket, db, userName, msgContent) {
	var collection = db.collection('favs');
	var rssObjs = msgContent;
	for (var i = 0, max = rssObjs.length; i < max; i++) {
		var rssObj = rssObjs[i];
		rssOp.modifyRSS(db, userName, rssObj,
			        function(err, object) {
						if (err) {
							socket.write(newsUtil.generateMsg(constant.modify, {'result': false, 'errorMsg': err.message}));
						} else {
							socket.write(newsUtil.generateMsg(constant.modify, {'result': true, 'errorMsg': ''}));
						}
					}
		);
	}
}



/**
  * Remove a RSS
  */
function remove(socket, db, userName, pushConfigObj, msgContent) {
	var collection = db.collection('favs');
	var rssObjs = msgContent;
	for (var i = 0, max = rssObjs.length; i < max; i++) {
		var rssObj = rssObjs[i];
		rssOp.removeRSS(db, userName, rssObj,
			        function(err, object) {
						if (err) {
							socket.write(newsUtil.generateMsg(constant.remove, {'result': false, 'errorMsg': err.message}));
						} else {
							socket.write(newsUtil.generateMsg(constant.remove, {'result': true, 'errorMsg': ''}));
						}
					}
		);
		pushConfigObj.remove(rssObj.url);
	}
}

function push(socket, db, userName, pushConfigObj, msgContent) {
	console.log(typeof(msgContent));
	if (pushConfigObj.push === msgContent) {
		socket.write(newsUtil.generateMsg(constant.push, {'result': true, 'errorMsg': ''}));
		return;
	}
	pushConfigObj.push = msgContent;
	if (msgContent) {
		pushConfigObj.start();
	} else {
		console.log("stop!");
		pushConfigObj.stop();
	}
	
	var collection = db.collection('userConfig');
	collection.findAndModify(
		{'userName': userName}, 
		null, 
		{$set: {push: msgContent}},
		{},
		function(err, object) {
			if (err) {
				// maybe no matching object is found
				socket.write(newsUtil.generateMsg(constant.push, {'result': false, 'errorMsg': err.message}));
			} else {
				socket.write(newsUtil.generateMsg(constant.push, {'result': true, 'errorMsg': ''}));
			}
		}
	);
}

exports.update = update;
exports.add = add;
exports.modify = modify;
exports.remove = remove;
exports.push = push;