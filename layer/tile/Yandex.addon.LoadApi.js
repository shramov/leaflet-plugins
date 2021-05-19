// This addon provides dynamical loading of Yandex Maps JS API, overriding L.Yandex's stub _initApi method.
// Implements static function `loadApi`, and embeds some api defaults in static properies `url`, `version`, `params`.
// If function is not called explicitly, it will be called on layer's add, appying layer's options.

// So typical usage is:
// ```js
// var yandex = L.yandex({
//   apiParams: '<your API-key>'
// }).addTo(map);
// ```

// For advanced usage see details below.

// @method loadApi(options?: Object): L.Yandex
// Starts loading API with specified `options`.
// (Most can be defaulted, see details in `apiParams`)

// @options apiLoader: function or thennable = undefined
// Function that will be used to load Yandex JS API (if it turns out not enabled on layer add).
// Must return any Promise-like thennable object.
// Instead of function it's also possible to specify Promise/thennable directly as option value.

// Alternatively:
// Standard loader will be used, picking `apiUrl` / `apiVersion` / `apiParams` options,
// and predefined defaults.

// @options apiUrl: String = 'https://api-maps.yandex.ru/{version}/'
// Either url template, or fully-qualified link to api script
// (incl. at least mandatory parameters).
// more info: https://tech.yandex.com/maps/jsapi/doc/2.1/dg/concepts/load-docpage/

// @options apiVersion: String = '2.1'
// Can be specified to use api version other then default,
// more info: https://tech.yandex.com/maps/jsapi/doc/2.1/versions/index-docpage/

// @option apiParams: Object or String
// Parameters to use when enabling API.
// There are some predefined defaults (see in code), but 'apikey' is still mandatory.
// It's also possible to specify `apikey` directly as `apiParams` string value.

var statics = {
	loadApi: function (options) {
		if (this.loading) { return this; }
		if ('ymaps' in window) {
			this.loading = Promise.resolve();
			return this.loading;
		}
		options = options || {};
		var loading = options.apiLoader ||
			this._loadScript.bind(this, this._makeUrl(options));
		if (!loading.then) {
			loading = loading();
		}
		loading.catch(this.onerror);
		this.loading = loading;
		return this;
	},

	onerror: function (e) {
		if (typeof e !== 'string') { arguments = ['API loading failed: ', e]; }
		console.error.apply(console, arguments);
	},

	// API defaults: https://tech.yandex.com/maps/jsapi/doc/2.1/dg/concepts/load-docpage/

	url: 'https://api-maps.yandex.ru/{version}/',

	version: '2.1',

	params: {
		// apikey: '<Your API key>',
		lang: 'ru_RU',
		// load: 'package.all',
		// mode: 'debug',
		// csp: true,
		// onload: console.log,
		onerror: 'console.error'
	},

	_makeUrl: function (options) {
		var url = options.apiUrl || this.url;
		if (url.search('{') === -1) { return url; } // fully-qualified url specified

		var params = options.apiParams;
		if (typeof params === 'string') { params = { apikey: params }; }
		params = L.extend({}, this.params, params);
		if (!params.apikey || !params.lang) {
			throw new Error('api params expected in options');
		}
		url += L.Util.getParamString(params, url);
		return L.Util.template(url, { version: options.apiVersion || this.version });
	},

	_onerror: function (resolve, reject, event) {
		reject('API loading failed: ' + event.target.src);
	},

	_loadScript: function (url) {
		return new Promise(function (resolve, reject) {
			var script = document.createElement('script');
			script.onload = resolve;
			script.onerror = this._onerror.bind(this, resolve, reject);
			script.src = url;
			document.body.appendChild(script);
		}.bind(this));
	}
};

for (var method in statics) {
	L.Yandex[method] = statics[method];
}

L.Yandex.include({
	loadApi: function (options) {
	        this._initApi(options);
		return this;
	},

	_initApi: function (options) {
		this.constructor.loadApi(options || this.options).loading.then(function () {
			window.ymaps.ready(this._initMapObject, this);
		}.bind(this), L.Util.falseFn);
	}
});
