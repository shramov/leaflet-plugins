Leaflet plugins
============

What ?
------

Miscellaneous Leaflet plugins for services that need to display
route information and need satellite imagery from different providers.
Currently it consists of:

 - Vector layers (`layer/vector/`):
   * GPX
   * KML
   * TOPOJSON

 - Providers implemented with respect to terms of use (`layer/tile`):
   * [Yandex][Yandex.md] - using Yandex Maps API v2;
   * [Bing][Bing.md] - with proper attribution.

 - Control (`control/`):
   * Permalink - OpenLayers compatible permanent link with support for storing location data in hash part (#lat=...);

[Yandex.md]: https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Yandex.md
[Bing.md]: https://github.com/shramov/leaflet-plugins/blob/master/layer/tile/Bing.md


Compatibility
------
 - Tested with: Leaflet 1.0.x
 - For use with Leaflet 0.7.x see `v2` branch


Where ?
------

Homepage : https://github.com/shramov/leaflet-plugins

Downloads : https://github.com/shramov/leaflet-plugins/releases

npm : https://www.npmjs.org/package/leaflet-plugins

cdnjs : https://cdnjs.com/libraries/leaflet-plugins
