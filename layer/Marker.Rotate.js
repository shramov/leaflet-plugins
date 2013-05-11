/*
 * Based on comments by @runanet and @coomsie 
 * https://github.com/CloudMade/Leaflet/issues/386
 *
 * Wrapping function is needed to preserve L.Marker.update function
 */
(function () {
    var _old_update = L.Marker.prototype.update;
    L.Marker.include({
        update: function() {
            this._icon.style[L.DomUtil.TRANSFORM] = "";
            if (this._shadow) {
                this._shadow.style[L.DomUtil.TRANSFORM] = "";
            }
            _old_update.apply(this, []);

            if (this.options.iconAngle) {
                var a = this.options.icon.options.iconAnchor;
                var s = this.options.icon.options.iconSize;
                var i = this._icon;
                this._updateImg(i, a, s);

                if (this._shadow) {
                    // Rotate around the icons anchor.
                    s = this.options.icon.options.shadowSize;
                    i = this._shadow;
                    this._updateImg(i, a, s);
                }

            }
        },

        _updateImg: function(i, a, s) {
            a = L.point(s).divideBy(2)._subtract(L.point(a));
            var transform = '';
            transform += ' translate(' + -a.x + 'px, ' + -a.y + 'px)';
            transform += ' rotate(' + this.options.iconAngle + 'deg)';
            transform += ' translate(' + a.x + 'px, ' + a.y + 'px)';
            i.style[L.DomUtil.TRANSFORM] += transform;
        },

        setIconAngle: function (iconAngle) {
            this.options.iconAngle = iconAngle;

            if (this._map) this.update();
        }
    });
}());
