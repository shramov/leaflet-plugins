# L.Yandex

A [Leaflet] basemap provider based on [Yandex.Maps JS API] [2.1](https://tech.yandex.com/maps/doc/jsapi/2.1/quick-start/index-docpage/).

`L.Yandex` extends [`L.Layer`](https://leafletjs.com/reference-1.5.1.html#layer).

[Leaflet]: https://leafletjs.com/
[Yandex.Maps JS API]: https://tech.yandex.com/maps/jsapi/


## API


### Usage example

```js
L.yandex('yandex#satellite').addTo(map);
```


### Creation

Factory: `L.yandex(<String> type?, <Object> options?)`

Instantiates a Yandex layer object given `type` and `options` arguments (both optional).

Can be used with single `options` argument, if it contains `type` property.


### Map types

* Valid _basemap_ types: `yandex#map`, `yandex#satellite`, `yandex#hybrid`, `yandex#map~vector`
or their short names: `map`, `satellite`, `hybrid`, `map~vector`.

* Valid _overlay_ types:
  - `overlay` - empty transparent map, which can be used for displaying data provided e.g. by controls.
  - `skeleton` - roads and labels, like in `hybrid` (but w/o basemap).


### Options

| Option	| Type		| Default	| Description	|
| ------	| ----		| -------	| -----------	|
| `type`  | `String` | `'yandex#map'`| The same as `type` argument.  |
| `mapOptions`	| `Object`	| (see in the [sources][Yandex.js])	| [Options][mapOptions] to set on map creation. |
| `overlayOpacity`	| `Number`	| `0.8`	| Opacity used for overlay map types.  |
| `opacity`	| `Number`	| `undefined`	| Force map opacity to given value. Not really useful, but kept for compatibility.  |

Note, that `traffic` option removed, as traffic layer can be added using ymaps JSAPI directly. See [Examples](#examples) and [Addons](#addons) sections of this documentation.

[mapOptions]: https://tech.yandex.com/maps/doc/jsapi/2.1/ref/reference/Map-docpage/#Map__param-options
[Yandex.js]: ./Yandex.js

[yandex.html]: ../../examples/yandex.html


### Events

`load`: Fired after Yandex map object is initialized.

Data: [Event](https://leafletjs.com/reference-1.5.1.html#event)


### Examples

* [yandex.html]: basic usage, incl. traffic layer sample.
 
* [yandex-controls.html]: adds some Yandex controls (incl. trafficControl), via ymaps JSAPI.

* [yandex-kml-gpx.html]: uses `geoXml` ymaps API to load KML/GPX.

[yandex-controls.html]: ../../examples/yandex-controls.html
[yandex-kml-gpx.html]: ../../examples/yandex-kml-gpx.html
[examples]: ../../examples/


## Addons

_'Addons'_ are optional scripts adding some custom functionality to main class.

Should be loaded after [Yandex.js].

Addons can add own api (options, methods, etc), that is described in their source files' comments.

* [Yandex.addon.LoadApi.js](./Yandex.addon.LoadApi.js)

  It's purpose is dynamic/deferred runtime API enabling.
  
  See [examples/yandex-addon-loadapi-*.html][examples].

* [Yandex.addon.Controls.js](./Yandex.addon.Controls.js)

  This addon allows using of Yandex controls just specifying them in options,
  without direct ymaps JSAPI calls.
  
  See [yandex-addon-controls.html] (functionality is the same as in [yandex-controls.html]).

* [Yandex.addon.Panorama.js](./Yandex.addon.Panorama.js)

  Purpose: to integrate panoramas player with leaflet map, avoiding controls conflicts.
  It's function is to take player out of map and put it into separate element.
  
  See [yandex-addon-panorama.html].

* [Yandex.addon.Fullscreen.js](./Yandex.addon.Fullscreen.js)

  Purpose: enable standard Yandex map controls/behaviors in fullscreen.
  
  See [yandex-addon-fullscreen.html].

[yandex-addon-controls.html]: ../../examples/yandex-addon-controls.html
[yandex-addon-panorama.html]: ../../examples/yandex-addon-panorama.html
[yandex-addon-fullscreen.html]: ../../examples/yandex-addon-fullscreen.html
