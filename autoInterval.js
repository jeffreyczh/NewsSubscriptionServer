/**
  * Module for the mechanism that decides the pushing interval
  */

/**
  * The function to determin the pushing interval
  * Returns the adjusted interval (million seconds)
  * oldItem: the RSS item before being updated
  * item: the RSS item after being updated
  */
function adjustInterval(oldItem, item, returnedContent) {
	/* The time difference in terms of minutes */
	var diff = 0;
	if (returnedContent) {
		// has update. Compare the last-modified time
		diff = ( Date.parse(item.lastModified) - Date.parse(oldItem.lastModified) ) / 60000;
	} else {
		// no updates
		diff = ( Date.parse(item.lastChecked) - Date.parse(oldItem.lastModified) ) / 60000;
	}
	if (diff > 1440) {
		// more than one day ago
		return 2 * 3600 * 1000; // set the interval to two hours
	}
	if ( diff > 360 && diff <= 1440 ) {
		// within 6 to 24 hours
		return 1 * 3600 * 1000; // one hour
	}
	if (diff > 60 && diff <= 360) {
		// within 1 to 6 hours
		return 15 * 60 * 1000; // 15 minutes
	}
	if (diff > 30 && diff <= 60) {
		// within 30 minutes to one hour
		return 5 * 60 * 1000; // 5 minutes
	}
	// within 30 minutes
	return 60 * 1000; // 1 minute
}

exports.adjustInterval = adjustInterval;