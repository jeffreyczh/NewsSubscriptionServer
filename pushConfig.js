/**
  * The object groups pushItems and provides related functions
  */
var pushItem = require("./pushItem");

PushConfig.prototype.push = false;
PushConfig.prototype.pushItems = [];
PushConfig.prototype.db = null;
PushConfig.prototype.userName = "";
PushConfig.prototype.socket = null;

/**
  * Constructor
  */
 function PushConfig(db, userName, socket, enablePush) {
	this.db = db;
	this.userName = userName;
	this.socket = socket;
	if (enablePush) {
		this.push = enablePush;
	}
 }

 /**
   * Start notification pushing
   */
 PushConfig.prototype.start = function() {
	this.push = true;
	for (var i = 0, max = this.pushItems.length; i < max; i++) {
		this.pushItems[i].start(this.db, this.userName, this.socket);
	}
 }

 /**
   * Stop notification pushing
   */
 PushConfig.prototype.stop = function () {
	 this.push = false;
	 for (var i = 0, max = this.pushItems.length; i < max; i++) {
		 this.pushItems[i].terminate();
	 }
 }

 /**
   * Adds a new RSS item and starts the notification pushing process for this item
   */
 PushConfig.prototype.add = function (url) {
	 if (this.indexOfPushItem(url) != -1) {
		 // the pushItem already exists
		 return;
	 }
	 var p_i = new pushItem.PushItem(url, this.db, this.userName, this.socket);
	 this.pushItems.push(p_i);
	 if (this.push) {
		 // the pushing notification turns on
		 // start the process for this RSS item
		 p_i.start(this.db, this.userName, this.socket);
	 }
 }

 /**
   * Removes a RSS item out and terminates the notification pushing process for this item
   */
 PushConfig.prototype.remove = function (url) {
	 var index = this.indexOfPushItem(url);
	 if (index == -1) {
		 return;
	 }
	 if (this.push) {
		 this.pushItems[index].terminate();
	 }
	 this.pushItems.splice(index, 1);
 }

/**
  * Looks for the index of a PushItem based on a given url
  * Returns the index or -1 if not found
  */
 PushConfig.prototype.indexOfPushItem = function (url) {
	 for (var i = 0, max = this.pushItems.length; i < max; i++) {
		 if (this.pushItems[i].url == url) {
			 return i;
		 }
	 }
	 return -1;
 }

/**
  * Searchs for the pushItem based on the url
  * Returns the pushItem object or null if not exists
  */
 PushConfig.prototype.getPushItem = function(url) {
	 var index = this.indexOfPushItem(url);
	 if (index == -1) {
		 return null;
	 }
	 return this.pushItems[index];
 }

 exports.PushConfig = PushConfig;