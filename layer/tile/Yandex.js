/* global ymaps: true */

L.Yandex = L.Layer.extend({

	options: {
		type: 'yandex#map', // 'map', 'satellite', 'hybrid' || 'overlay'
		maxZoom: 19,
		overlayOpacity: 0.8,
		background: 'transparent',
		traffic: false,
		minZoom: 0,
		maxZoom: 19
	},

	initialize: function (type, options) {
		if (typeof type === 'object') {
			options = type;
			type = false;
		}
		L.Util.setOptions(this, options);
		if (type) { this.options.type = type; }
		this._isOverlay = this.options.type.indexOf('overlay') !== -1;
	},

	onAdd: function () {
		this._initContainer();
		this._initMapObject();
		map._controlCorners.bottomright.style.marginBottom = '3em';
	},

	beforeAdd: function (map) {
		map._addZoomLimit(this);
	},

	onRemove: function (map) {
		this._container.remove();
		map._removeZoomLimit(this);
		if (map._controlCorners) {
			map._controlCorners.bottomright.style.marginBottom = '0em';
		}
	},

	getEvents: function () {
		return {
			move: this._update
		};
	},

	_update: function () {
		if (!this._yandex) { return; }
		var center = this._map.getCenter();
		this._yandex.setCenter([center.lat, center.lng], this._map.getZoom());
	},

	_initContainer: function () {
		if (!this._container) {
			var className = 'leaflet-yandex-layer leaflet-map-pane leaflet-pane '
				+ (this._isOverlay ? 'leaflet-overlay-pane' : 'leaflet-tile-pane');
			this._container = L.DomUtil.create('div', className);
			this._container.id = '_YMapContainer_' + L.Util.stamp(this);
			var opacity = this.options.opacity || this._isOverlay && this.options.overlayOpacity;
			if (opacity) {
				L.DomUtil.setOpacity(this._container, opacity);
			}
			this._container.style.width = '100%';
			this._container.style.height = '100%';
		}
		this._map.getContainer().appendChild(this._container);
	},

	_mapType: function () {
		var shortType = this.options.type;
		if (!shortType || shortType.indexOf('#') !== -1) {
			return shortType;
		}
		if (shortType === 'overlay') {
			return new ymaps.MapType('overlay', []);
		}
		return 'yandex#' + shortType;
	},

	_initMapObject: function () {
		if (this._yandex) {
			this._update();
			return;
		}

		// Check that ymaps.Map is ready
		if (!ymaps.Map) {
			return ymaps.load(['package.map'], this._initMapObject, this);
		}

		// If traffic layer is requested check if control.TrafficControl is ready
		if (this.options.traffic) {
			if (!ymaps.control || !ymaps.control.TrafficControl) {
				return ymaps.load(['package.traffic', 'package.controls'],
					this._initMapObject, this);
			}
		}

		//Creating ymaps map-object without any default controls on it
		var map = new ymaps.Map(this._container, {center: [0, 0], zoom: 0, behaviors: [], controls: []});

		var background = this._isOverlay ? 'transparent' : this.options.background;
		if (background) {
			map.container.getElement().style.background = background;
		}

		if (this.options.traffic) {
			map.controls.add(new ymaps.control.TrafficControl({shown: true}));
		}
		map.setType(this._mapType());

		this._yandex = map;
		if (this._map) { this._update(); }

		//Reporting that map-object was initialized
		this.fire('MapObjectInitialized', { mapObject: map });
	}
});

L.yandex = function (type, options) {
	return new L.Yandex(type, options);
};
