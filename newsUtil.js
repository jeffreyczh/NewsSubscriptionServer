/*
 * Some helper functions here
 */
var constant = require('./constant');
 /**
   * Get the communication content from the received string
   * In other words, it gets the content between the header and the footer
   * Please see constant.js for the provided header and footer
   * Returns the content
   * NOTE: It will return 'undefined' if there are no content or 
   *       the data doesn't match the header + footer
   */
 function getContent(revData, header) {
	 var index_left = revData.indexOf(header);
	 var index_right = revData.indexOf(constant.endOfData);
	 return revData.substring(index_left + header.length, index_right);
 }


 exports.getContent = getContent;