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
	L.DeferredLayer = L.LayerGroup.extend({
		options: {
			js: [],
			init: null
		},

		_script_cache: {},

		initialize: function (options) {
			L.Util.setOptions(this, options);
			L.LayerGroup.prototype.initialize.apply(this);
			this._loaded = false;
		},

		onAdd: function (map) {
			L.LayerGroup.prototype.onAdd.apply(this, [map]);
			if (this._loaded) return;
			var loaded = function () {
				this._loaded = true;
				var l = this.options.init();
				if (l)
					this.addLayer(l);
			};
			this._loadScripts(this.options.js.reverse(), L.Util.bind(loaded, this));
		},

		_loadScripts: function (scripts, cb, args) {
			if (!scripts || scripts.length === 0)
				return cb(args);
			var _this = this, s = scripts.pop(), c;
			c = this._script_cache[s];
			if (c === undefined) {
				c = {url: s, wait: []};
				var script = document.createElement('script');
				script.src = s;
				script.type = 'text/javascript';
				script.onload = function () {
					c.e.readyState = 'completed';
					var i = 0;
					for (i = 0; i < c.wait.length; i++)
						c.wait[i]();
				};
				c.e = script;
				document.getElementsByTagName('head')[0].appendChild(script);
			}
			function _cb () { _this._loadScripts(scripts, cb, args); }
			c.wait.push(_cb);
			if (c.e.readyState === 'completed')
				_cb();
			this._script_cache[s] = c;
		}
	});
}, window));