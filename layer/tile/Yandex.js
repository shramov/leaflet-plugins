// https://tech.yandex.com/maps/doc/jsapi/2.1/quick-start/index-docpage/

/* global ymaps: true */

L.Yandex = L.Layer.extend({

	options: {
		type: 'yandex#map', // 'map', 'satellite', 'hybrid', 'map~vector' | 'overlay', 'skeleton'
		mapOptions: { // https://tech.yandex.com/maps/doc/jsapi/2.1/ref/reference/Map-docpage/#Map__param-options
			// yandexMapDisablePoiInteractivity: true,
			balloonAutoPan: false,
			suppressMapOpenBlock: true
		},
		overlayOpacity: 0.8,
		minZoom: 0,
		maxZoom: 19
	},

	initialize: function (type, options) {
		if (typeof type === 'object') {
			options = type;
			type = false;
		}
		options = L.Util.setOptions(this, options);
		if (type) { options.type = type; }
		this._isOverlay = options.type.indexOf('overlay') !== -1 ||
		                  options.type.indexOf('skeleton') !== -1;
	},

	onAdd: function () {
		this._initContainer();
		if (this._yandex) {
			return this._update();
		}
		ymaps.ready(this._initMapObject, this);
	},

	beforeAdd: function (map) {
		map._addZoomLimit(this);
	},

	onRemove: function (map) {
		this._container.remove();
		map._removeZoomLimit(this);
	},

	getEvents: function () {
		var events = {
			move: this._update
		};
		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}
		return events;
	},

	_update: function () {
		if (!this._yandex) { return; }
		var map = this._map;
		var center = map.getCenter();
		this._yandex.setCenter([center.lat, center.lng], map.getZoom());
		var offset = L.point(0,0).subtract(L.DomUtil.getPosition(map.getPane('mapPane')));
		L.DomUtil.setPosition(this._container, offset); // move to visible part of pane
	},

	_animateZoom: function (e) {
		var map = this._map;
		var topLeft = map._getNewPixelOrigin(e.center, e.zoom);
                var offset = map.project(map.getBounds().getNorthWest(), e.zoom)._subtract(topLeft);
		L.DomUtil.setTransform(this._container, offset, map.getZoomScale(e.zoom));
	},

	_setStyle: function (el, style) {
		for (var prop in style) {
			el.style[prop] = style[prop];
		}
	},

	_initContainer: function () {
		var mapPane = this._map.getPane('mapPane');
		if (!this._container) {
			var className = 'leaflet-yandex-layer leaflet-map-pane leaflet-pane '
				+ (this._isOverlay ? 'leaflet-overlay-pane' : 'leaflet-tile-pane');
			if (this._zoomAnimated) { className += ' leaflet-zoom-animated'; }
			this._container = L.DomUtil.create('div', className);
			this._container.id = '_YMapContainer_' + L.Util.stamp(this);
			var opacity = this.options.opacity || this._isOverlay && this.options.overlayOpacity;
			if (opacity) {
				L.DomUtil.setOpacity(this._container, opacity);
			}
			var auto = { width: '100%', height: '100%' };
			this._setStyle(mapPane, auto);         // need to set this explicitly,
			this._setStyle(this._container, auto); // otherwise ymaps fails to follow container size changes
		}
		mapPane.appendChild(this._container);
	},

	_mapType: function () {
		var shortType = this.options.type;
		if (!shortType || shortType.indexOf('#') !== -1) {
			return shortType;
		}
		return 'yandex#' + shortType;
	},

	_initMapObject: function () {
		ymaps.mapType.storage.add('yandex#overlay', new ymaps.MapType('overlay', []));
		ymaps.mapType.storage.add('yandex#skeleton', new ymaps.MapType('skeleton', ['yandex#skeleton']));
		ymaps.mapType.storage.add('yandex#map~vector', new ymaps.MapType('map~vector', ['yandex#map~vector']));
		var ymap = new ymaps.Map(this._container, {
			center: [0, 0], zoom: 0, behaviors: [], controls: [],
			type: this._mapType()
		}, this.options.mapOptions);

		if (this._isOverlay) {
			ymap.container.getElement().style.background = 'transparent';
		}
		if (this.options.trafficControl) {
			ymap.controls.add('trafficControl', { size: 'small' });
			ymap.controls.get('trafficControl').state.set({ trafficShown: true });
		}
		this._yandex = ymap;
		if (this._map) { this._update(); }

		//Reporting that map-object was initialized
		this.fire('MapObjectInitialized', { mapObject: ymap });
	}
});

L.yandex = function (type, options) {
	return new L.Yandex(type, options);
};
