# L.BingLayer

A [Leaflet] basemap provider based on [Bing Maps REST Services].

`L.BingLayer` extends [`L.TileLayer`](https://leafletjs.com/reference-1.5.1.html#tilelayer).

**Feature highlights:**
- proper dynamic attribution.
- metadata requested only after layer actually added on map (important, as such requests are [billable]).
- most common `TileLayer` options supported: `detectRetina`, `maxNativeZoom`, and so on.

[Leaflet]: https://leafletjs.com/
[Bing Maps REST Services]: https://docs.microsoft.com/bingmaps/rest-services/
[billable]: https://docs.microsoft.com/bingmaps/getting-started/bing-maps-dev-center-help/understanding-bing-maps-transactions#rest-services


## API


### Usage example

```js
L.bingLayer('[YOUR_BING_MAPS_KEY]').addTo(map);
```


### Creation

Factory: `L.bingLayer(<String> key?, <Object> options)`

Instantiates a Bing layer object given `key` and `options` arguments (both optional).

Can be used with single `options` argument, if it contains `key` property.


### Options

| Option	| Type		| Default	| Description	|
| ------	| ----		| -------	| -----------	|
| `imagerySet`  | `String`	| `'Aerial'`	| Any valid [imagerySet] (except `Birdseye*` and `Streetside`).<br/>Note: _default is subject to change on next major version._	|
| `culture`	| `String`	| `''`	| Any valid [culture] code.	|
| `style`	| `String`	| `''`	| Custom [Map Style][style] string.	|
| `retinaDpi`	| `String`	| `'d2'`	| Used to render larger lables when [`detectRetina`] option is active.<br/>The value of this option is added to tile query url as additional parameter `&dpi=d2`.<br/>Note: _this is not documented in REST API docs (but [working][enableHighDpi])._	|

Additionally:
- `type` is the same as `imagerySet` (compatibility with previous versions).
- `bingMapsKey` is the same as `key` (for easy migration from [digidem/leaflet-bing-layer])

See also options inherited from [`L.TileLayer`](https://leafletjs.com/reference-1.5.1.html#tilelayer-l-tilelayer)
(most useful: `detectRetina`, `maxZoom`, `maxNativeZoom`).

[imagerySet]: https://docs.microsoft.com/bingmaps/rest-services/imagery/get-imagery-metadata#template-parameters
[culture]: https://docs.microsoft.com/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes
[style]: https://docs.microsoft.com/bingmaps/articles/custom-map-styles-in-bing-maps#custom-map-styles-in-the-rest-and-tile-services
[`detectRetina`]: https://leafletjs.com/reference-1.5.0.html#tilelayer-detectretina
[enableHighDpi]: https://blogs.bing.com/maps/2015/02/12/high-ppi-maps-now-available-in-the-bing-maps-ajax-control
[digidem/leaflet-bing-layer]: [/digidem/leaflet-bing-layer]

### Events

`load`: Fired after metadata initialized.

Data: [Event](https://leafletjs.com/reference-1.5.1.html#event), extended with additional `meta` property.


### Examples

[bing.html](../../examples/bing.html)
 

## Addons

_'Addons'_ are optional scripts adding some custom functionality to main class.

Should be loaded after [Bing.js](./Bing.js).

Addons can add own api (options, methods, etc), that is described in their source files' comments.

* [Bing.addon.applyMaxNativeZoom.js](./Bing.addon.applyMaxNativeZoom.js)

  Metadata [response] has `zoomMin`/`zoomMax` properties, that currently (in most cases) are constant: `1`/`21`.
  But in fact, imagery for '_Aerial*_' and (deprecated) '_Road_' sets may be absent at high zoom levels,
  depending on location.

  This addon is intended to find and apply *real* maximum available zoom (for current location) on layer add.

[response]: https://docs.microsoft.com/bingmaps/rest-services/imagery/get-imagery-metadata#response