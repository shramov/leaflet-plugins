/*
 * L.TileLayer is used for standard xyz-numbered tile layers.
 */

L.Yandex = L.Class.extend({
	includes: L.Mixin.Events,

	options: {
		minZoom: 0,
		maxZoom: 18,
		attribution: '',
		opacity: 1,
		traffic: false,
	},

	// Possible types: SATELLITE, ROADMAP, HYBRID
	initialize: function(type, options) {
		L.Util.setOptions(this, options);

		this._type = "yandex#" + (type || 'map');
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

		this._reset();
		this._update(true);
	},

	onRemove: function(map) {
		this._map._container.removeChild(this._container);

		this._map.off('viewreset', this._resetCallback, this);

		this._map.off('move', this._update, this);
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

	_initContainer: function() {
		var tilePane = this._map._container
			first = tilePane.firstChild;

		if (!this._container) {
			this._container = L.DomUtil.create('div', 'leaflet-yandex-layer leaflet-top leaflet-left');
			this._container.id = "_YMapContainer";
		}

		if (this.options.overlay)
			first = first.nextSibling;
		tilePane.insertBefore(this._container, first);

		this.setOpacity(this.options.opacity);
		var size = this._map.getSize();
		this._container.style.width = size.x;
		this._container.style.height = size.y;
	},

	_initMapObject: function() {
		if (this._yandex) return;
		var map = new ymaps.Map(this._container, {center: [0,0], zoom: 0}); //, {ignoreResize: false, propagateEvents: true});

		if (this.options.traffic) {
			ymaps.load("traffic", function() {
				var traffic = new ymaps.control.TrafficControl({shown: true});
				map.controls.add(traffic);
			});
		}

		if (this._type == "yandex#null")
			this._type = new ymaps.MapType("null", []);
		map.setType(this._type)

		this._yandex = map;
	},

	_resetCallback: function(e) {
		this._reset(e.hard);
	},

	_reset: function(clearOldContainer) {
		this._initContainer();
	},

	_update: function(force) {
		this._resize(force);

		var center = this._map.getCenter();
		var _center = [center.lat, center.lng];
		var zoom = this._map.getZoom();

		if (force || this._yandex.getZoom() != zoom)
			this._yandex.setZoom(zoom);
		this._yandex.panTo(_center, {duration: 0, delay: 0});
	},

	_resize: function(force) {
		var size = this._map.getSize(), style = this._container.style;
		if (style.width == size.x + "px" &&
		    style.height == size.y + "px")
			if (force != true) return;
		style.width = size.x;
		style.height = size.y;
		var b = this._map.getBounds(), sw = b.getSouthWest(), ne = b.getNorthEast();
		this._yandex.container.fitToViewport();
	}
});
