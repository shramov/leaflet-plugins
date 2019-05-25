/* global ymaps: true */

L.Yandex = L.Layer.extend({

	options: {
		traffic: false,
		minZoom: 0,
		maxZoom: 19
	},

	possibleShortMapTypes: {
		schemaMap: 'map',
		satelliteMap: 'satellite',
		hybridMap: 'hybrid',
		publicMap: 'publicMap',
		publicMapInHybridView: 'publicMapHybrid',
		overlay: 'overlay'
	},

	_getPossibleMapType: function (mapType) {
		var result = 'yandex#map';
		if (typeof mapType !== 'string') {
			return result;
		}
		for (var key in this.possibleShortMapTypes) {
			if (mapType === this.possibleShortMapTypes[key]) {
				result = 'yandex#' + mapType;
				break;
			}
			if (mapType === ('yandex#' + this.possibleShortMapTypes[key])) {
				result = mapType;
			}
		}
		return result;
	},

	// Possible types: yandex#map, yandex#satellite, yandex#hybrid, yandex#publicMap, yandex#publicMapHybrid
	// Or their short names: map, satellite, hybrid, publicMap, publicMapHybrid
	initialize: function (type, options) {
		if (typeof type === 'object') {
			options = type;
			type = options.type;
		}
		L.Util.setOptions(this, options);
		//Assigning an initial map type for the Yandex layer
		this._type = this._getPossibleMapType(type || this.options.type);
	},

	onAdd: function () {
		this._initContainer();
		this._initMapObject();
		map.on('move', this._update, this);
		map._controlCorners.bottomright.style.marginBottom = '3em';
	},

	beforeAdd: function (map) {
		map._addZoomLimit(this);
	},

	onRemove: function (map) {
		this._container.remove();
		map._removeZoomLimit(this);
		this._map.off('move', this._update, this);
		if (map._controlCorners) {
			map._controlCorners.bottomright.style.marginBottom = '0em';
		}
	},

	_initContainer: function () {
		if (!this._container) {
			var className = 'leaflet-yandex-layer leaflet-map-pane leaflet-pane '
				+ (this.options.overlay ? 'leaflet-overlay-pane' : 'leaflet-tile-pane');
			this._container = L.DomUtil.create('div', className);
			this._container.id = '_YMapContainer_' + L.Util.stamp(this);
			if (this.options.opacity < 1) {
				L.DomUtil.setOpacity(this._container, this.options.opacity);
			}
			this._container.style.width = '100%';
			this._container.style.height = '100%';
		}
		this._map.getContainer().appendChild(this._container);
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

		if (this.options.traffic) {
			map.controls.add(new ymaps.control.TrafficControl({shown: true}));
		}
		if (this.options.overlay) {
			this._type = new ymaps.MapType('overlay', []);
			map.container.getElement().style.background = 'transparent';
		}
		map.setType(this._type);

		this._yandex = map;
		if (this._map) { this._update(); }

		//Reporting that map-object was initialized
		this.fire('MapObjectInitialized', { mapObject: map });
	},

	_update: function () {
		if (!this._yandex) { return; }
		var center = this._map.getCenter();
		this._yandex.setCenter([center.lat, center.lng], this._map.getZoom());
	}
});

L.yandex = function (type, options) {
	return new L.Yandex(type, options);
};
