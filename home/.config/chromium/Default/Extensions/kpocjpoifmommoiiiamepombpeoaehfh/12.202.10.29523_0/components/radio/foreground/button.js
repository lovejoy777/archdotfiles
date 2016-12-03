var radio = (function() {
	return {
		init: function() {
			var ID = 'radioWidget',
				$volumeSlider = $('#' + ID + "_volumeSlider");

			$volumeSlider.change(function(event) {
				chrome.extension.sendRequest({name: ID + '_volume', volume: Number(this.value)});
			});
		}
	};
}());