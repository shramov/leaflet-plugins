/*
 * Google layer using Google Maps API v3
 */
(function (W, L) {

var maps,
	debug = function() {
		if (W.console && W.console.debug) {
			W.console.log.apply(W.console, arguments)
		}
	};

L.Google = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		tileSize: 256,
		errorTileUrl: '',
		attribution: '',
		opacity: 1,
		continuousWorld: false,
		noWrap: false
	},

	statics: {
		url: 'http://maps.google.com/maps/api/js?v=3.2&sensor=false&callback=L.Google.initialize',
		initialize: function() {
			// fake method
		}
	},

	_google: null,

	// Possible types: SATELLITE, ROADMAP, HYBRID, TERRAIN
	initialize: function(type, options) {
		L.Util.setOptions(this, options);

		this._type = type || 'SATELLITE';
	},

	onAdd: function(map, insertAtTheBottom) {
		this._map = map;
		this._insertAtTheBottom = insertAtTheBottom;

		// create a container div for tiles
		this._initContainer();
		this._initMapObject();

		// set up events
		map.on('viewreset', this._resetCallback, this);

		this._limitedUpdate = L.Util.limitExecByInterval(this._update, 150, this);
		map.on('move', this._update, this);
		//map.on('moveend', this._update, this);

		map._controlCorners['bottomright'].style.marginBottom = "1em";
	},

	onRemove: function(map) {
		this._map._container.removeChild(this._container);
		//this._container = null;

		this._map.off('viewreset', this._resetCallback, this);

		this._map.off('move', this._update, this);
		map._controlCorners['bottomright'].style.marginBottom = "0em";
		//this._map.off('moveend', this._update, this);
	},

	getAttribution: function() {
		return this.options.attribution;
	},

	setOpacity: function(opacity) {
		this.options.opacity = opacity;
		if (opacity < 1) {
			L.DomUtil.setOpacity(this._container, opacity);
		}
	},

	setElementSize: function(e, size) {
		e.style.width = size.x + "px";
		e.style.height = size.y + "px";
	},

	_initContainer: function() {
		var tilePane = this._map._container,
			first = tilePane.firstChild;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-google-layer leaflet-top leaflet-left');
			this._container.id = "_GMapContainer";
		}

		if (true) {
			tilePane.insertBefore(this._container, first);

			this.setOpacity(this.options.opacity);
			this.setElementSize(this._container, this._map.getSize());
		}
	},

	_initMapObject: function() {
		if (this._google) {
			return;
		}

		if (typeof W.google == 'undefined') {
			debug("L.Google: dynamically load script");

			var script = document.createElement('script'),
				head = document.head || document.getElementsByTagName('head')[0] || document.documentElement,
				callback = L.Util.bind(this._initMapObject, this);

			script.type = 'text/javascript';
			script.async = 'async';
			script.src = L.Google.url;

			script.onload = script.onreadystatechange = function(_, isAbort) {
				if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
					// Handle memory leak in IE
					script.onload = script.onreadystatechange = null;

					// Remove the script
					if (head && script.parentNode ) {
						head.removeChild(script);
					}

					// Dereference the script
					script = undefined;

					// Callback if not abort
					if (!isAbort) {
						callback();
					}
				}
			};

			head.insertBefore( script, head.firstChild );

			return;
		}

		maps = W.google.maps;

		if (maps.Map === undefined) {
			W.setTimeout(L.Util.bind(this._initMapObject, this), 100);

			return;
		}

		var map = new maps.Map(this._container, {
		    center: new maps.LatLng(0, 0),
		    zoom: 0,
		    mapTypeId: maps.MapTypeId[this._type],
		    disableDefaultUI: true,
		    keyboardShortcuts: false,
		    draggable: false,
		    disableDoubleClickZoom: true,
		    scrollwheel: false,
		    streetViewControl: false
		});

		this._reposition = maps.event.addListenerOnce(map, "center_changed", L.Util.bind(this.onReposition, this));

		map.backgroundColor = '#ff0000';
		this._google = map;

		this._reset();
		this._update();
	},

	_resetCallback: function(e) {
		this._reset(e.hard);
	},

	_reset: function(clearOldContainer) {
		this._initContainer();
	},

	_update: function() {
		if (!this._google) {
			return;
		}
		this._resize();

		var bounds = this._map.getBounds();
		var ne = bounds.getNorthEast();
		var sw = bounds.getSouthWest();
		var google_bounds = new maps.LatLngBounds(
			new maps.LatLng(sw.lat, sw.lng),
			new maps.LatLng(ne.lat, ne.lng)
		);
		var center = this._map.getCenter();
		var _center = new maps.LatLng(center.lat, center.lng);

		this._google.setCenter(_center);
		this._google.setZoom(this._map.getZoom());
		//this._google.fitBounds(google_bounds);
	},

	_resize: function() {
		var size = this._map.getSize();
		if (this._container.style.width == size.x && this._container.style.height == size.y) {
			return;
		}

		this.setElementSize(this._container, size);
		this.onReposition();
	},

	onReposition: function() {
		if (!this._google) {
			return;
		}
		maps.event.trigger(this._google, "resize");
	}
});

})(window, L);
