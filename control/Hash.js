// From ModestMaps.
var HAS_HASHCHANGE = (function() {
    var doc_mode = window.documentMode;
    return ('onhashchange' in window) && (doc_mode === undefined || doc_mode > 7);
})();

L.Control.Hash = L.Control.Permalink.extend({
    onAdd: function(map) {
        this._container = L.Control.Permalink.prototype.onAdd.call(this, map);

        if (this.options.useAnchor && HAS_HASHCHANGE) {
            // Hijacking hashchange listners.
            this._onhashchange = L.Util.bind(this._onhashchange, this);
            this._update = window.onhashchange;
            window.onhashchange = this._onhashchange;
        }

        return this._container;
    },
    _update_href: function() {
        L.Control.Permalink.prototype._update_href.call(this);
        this._update_fragment();
    },
    _update_layers: function() {
        L.Control.Permalink.prototype._update_layers.call(this);
        this._update_fragment();
    },
    _update_fragment: function() {
        // Do nothing if <= IE7
        if (!HAS_HASHCHANGE) return;

        var params = L.Util.getParamString(this._params),
            hash = '#' + params.slice(1);

        this._moving = true;
        location.replace(hash);
    },
    _onhashchange: function (e) {
        if (!this._moving) {
            this._update();
        }
        else {
            this._moving = false;
        }
    },
    _update: null,
    _moving: false
});
