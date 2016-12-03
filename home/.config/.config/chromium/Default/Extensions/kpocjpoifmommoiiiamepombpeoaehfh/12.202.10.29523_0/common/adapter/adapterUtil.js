if (!window.Mindspark_) {
	window.Mindspark_ = {};
}

if (!Mindspark_.underscore) {
	Mindspark_.underscore = _;
}

Mindspark_.adapterUtil = function() {

	var DEFAULT_WINDOW_BEHAVIOR = "menu";

	// Maps out dialog behavior
	var dialogConfigMappings = {
		menu: {
			menuLike: true
		},
		modal: {
			modal: true
		},
		tabOverlay: {
			alwaysOnTop: true,
			linkedToTab: true
		},
		browserOverlay: {
			alwaysOnTop: true
		}
	};

    return {
        sendAjaxRequest: function(params, callback) {
            var request = new XMLHttpRequest(),
                response,
                method,
                data = null,
                contentType = null,
                entity = params.entity;

            if (entity) {
                method = params.method || 'POST';
                contentType = entity.contentType;
                data = entity.data;
            } else {
                method = params.method || 'GET';
            }

            request.open(method, params.url);
            if (contentType != null) {
                request.setRequestHeader('Content-Type', contentType);
            }
            request.onload = function() {
                try {
                    response = {'status': request.status, 'content': request.responseText};
                    if (request.status != 200 && request.status != 304)
                        response.error = request.statusText;
                    callback(response);
                } catch (e) {
                    callback({'error': e.message || JSON.stringify(e)});
                }
            };
            request.onerror = function(event) {
                callback({'error': 'fatal'});
            };
            try {

                request.send(data);
            } catch (e) {
                callback({'error': e.message || JSON.stringify(e)});
            }

        },

		getDialogConfig: function(behavior) {
			return dialogConfigMappings[behavior || DEFAULT_WINDOW_BEHAVIOR];
		},

		getBoundedWindowPosition: function(info) {
			var _ = Mindspark_.underscore,
				x = info.x,
				y = info.y,
				windowPositionInfo = info.windowPositionInfo,
				anchorRectangle = info.anchorRectangle,
				boundingRectangle = info.boundingRectangle,
				enforceAxisY = !_.isUndefined(info.enforceAxisY) ? info.enforceAxisY : true,
				isMenuItem = info.isMenuItem;

			if (isMenuItem) {
				x += anchorRectangle.width;
				y -= anchorRectangle.height;
			}

			// Detect window overflowing RIGHT of the bounding rectangle
			if (x + windowPositionInfo.width > boundingRectangle.left + boundingRectangle.width) {
				x = anchorRectangle.left;

				if (isMenuItem) {
					x -= anchorRectangle.width;
				}

				// We are flipping the axes, so account for offsets
				if (_.isNumber(windowPositionInfo.left) && windowPositionInfo.left < 0) {
					x -= windowPositionInfo.left;
				} else if (_.isNumber(windowPositionInfo.right) && windowPositionInfo.right > 0) {
					x += windowPositionInfo.right;
				}

				// Try positioning the rightmost tip on the rightmost tip of the target
				x = x - windowPositionInfo.width + anchorRectangle.width;

				// Detect window overflowing LEFT of the bounding rectangle
				if (x < boundingRectangle.left) {
					// Align the left edge of the window with that of the bounding rectangle
					x = boundingRectangle.left;
				}
			}

			// Detect window overflowing BOTTOM of the bounding rectangle
			if (enforceAxisY && y + windowPositionInfo.height > boundingRectangle.top + boundingRectangle.height) {
				y = anchorRectangle.top;

				if (!isMenuItem) {
					y -= anchorRectangle.height;
				}

				// We are flipping the axes, so account for offsets
				if (_.isNumber(windowPositionInfo.top) && windowPositionInfo.top < 0) {
					y -= windowPositionInfo.top;
				} else if (_.isNumber(windowPositionInfo.bottom) && windowPositionInfo.bottom > 0) {
					y += windowPositionInfo.bottom;
				}

				// Try positioning the window above the anchor
				y -= windowPositionInfo.height;

				// Detect window overflowing TOP of the bounding rectangle
				if (y < boundingRectangle.top) {
					// Align the top edge of the window with that of the bounding rectangle
//					y = boundingRectangle.top;

					// Center the widget window in the bounding rectangle
					y = boundingRectangle.top + ( boundingRectangle.height - windowPositionInfo.height ) / 2;
					x = boundingRectangle.left + ( boundingRectangle.width - windowPositionInfo.width ) / 2;
				}
			}

			return {
				x: x,
				y: y
			};
		}
    };
}();