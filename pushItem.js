/**
  * Object with the info and operation of the RSS item that need to be pushed
  */
var rssOp = require("./rssOp");
var autoInterval = require("./autoInterval");
var newsUtil = require("./newsUtil");
var constant = require("./constant");

PushItem.prototype.url = "";// url of the RSS
PushItem.prototype.timerObj = null; // the timer obj for setting / stopping timer
PushItem.prototype.interval = 60000; // by default, the checking interval is 1 min
PushItem.prototype.terminated = false; // to indicate if the notification pushing of this item is terminated or not

/**
  * Constructor
  */
function PushItem(url) {
	this.url = url;
}

/**
  * Start the notification pushing process for this RSS item
  */
PushItem.prototype.start = function (db, userName, socket) {
	this.terminated = false;
	var pushItem = this;
	// check the update imediately in order to update the stored timestamp
	rssOp.getRSSUpdate(db, userName, [this.url], 
			function (oldItem, item, returnedContent) {
				pushItem.timerObj = setTimeout(function() {
					pushItem.update(db, userName, socket);
				}, pushItem.interval);
			}
	);
}

/**
  * Updates the RSS item and adjust the interval for the next check
  */
PushItem.prototype.update = function(db, userName, socket) {
	if (this.terminated && this.timerObj) {
		clearTimeout(this.timerObj);
		this.timerObj = null;
		console.log("stop later!");
		return;
	}
	var pushItem = this;
	rssOp.getRSSUpdate(db, userName, [this.url], 
					   function (oldItem, item, returnedContent) {
							if (returnedContent) {
								// send the update to the client
								socket.write(newsUtil.generateMsg(constant.update, 
															  {'name': item.name, 'url': item.url, 'content': returnedContent, 'lastChecked': item.lastChecked}));
							}
						   // adjust the interval
						   pushItem.interval = autoInterval.adjustInterval(oldItem, item, returnedContent);
						   console.log(item.url + " --- interval: " + pushItem.interval);
						   pushItem.timerObj = setTimeout(function() {
								pushItem.update(db, userName, socket);
						   }, pushItem.interval);
					   }
	);
}

/**
  * Stop pushing notification for this RSS item
  */
PushItem.prototype.terminate = function() {
	this.terminated = true;
	if (this.timerObj) {
		console.log("clean time out!");
		clearTimeout(this.timerObj);
		this.timerObj = null;
	}
	// if the timer has not been set yet, stop it later
}

exports.PushItem = PushItem;