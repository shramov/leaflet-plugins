(function (factory, window) {
    // define an AMD module that relies on 'leaflet'
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    // define a Common JS module that relies on 'leaflet'
    } else if (typeof exports === 'object') {
        module.exports = factory(require('leaflet'));
    }
    // attach your plugin to the global 'L' variable
    if (typeof window !== 'undefined' && window.L) {
        window.L.YourPlugin = factory(L);
    }
}(function (L) {
	L.Icon.Canvas = L.Icon.extend({
		options: {
			iconSize: new L.Point(20, 20), // Have to be supplied
			/*
			iconAnchor: (Point)
			popupAnchor: (Point)
			*/
			className: 'leaflet-canvas-icon'
		},

		createIcon: function () {
			var e = document.createElement('canvas');
			this._setIconStyles(e, 'icon');
			var s = this.options.iconSize;
			e.width = s.x;
			e.height = s.y;
			this.draw(e.getContext('2d'), s.x, s.y);
			return e;
		},

		createShadow: function () {
			return null;
		}
	});
}, window));