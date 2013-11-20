/*global L: true */

L.KML = L.FeatureGroup.extend({
	options: {
		async: true
	},

	initialize: function(kml, options) {
		L.Util.setOptions(this, options);
		this._kml = kml;
		this._layers = {};

		if (kml) {
			this.addKML(kml, options, this.options.async);
		}
	},

	loadXML: function(url, cb, options, async) {
		if (async == undefined) async = this.options.async;
		if (options == undefined) options = this.options;
		if (url.substr(0,5).toLowerCase() == 'blob:')	{	options['urlIsBlob'] = true;	
															options['kmlBlob'] = url; // store this URL reference for later memory clean-up - not yet implemented
														}
		
		var req = new window.XMLHttpRequest();
		req.open('GET', url, async);
		try {
			req.overrideMimeType('text/xml'); // unsupported by IE
		} catch(e) {}
		req.onreadystatechange = function() {
			if (req.readyState != 4) return;
			if (options.urlIsBlob == true)
			{	cb(req.responseXML, options);	}
			else
			{	if(req.status == 200) cb(req.responseXML, options);		}
		};
		req.send(null);
	},

	addKML: function(url, options, async) {
		var _this = this;
		var cb = function(gpx, options) { _this._addKML(gpx, options) };
		this.loadXML(url, cb, options, async);
	},

	_addKML: function(xml, options) {
		var layers = L.KML.parseKML(xml, options);
		if (!layers || !layers.length) return;
		for (var i = 0; i < layers.length; i++)
		{	this.fire('addlayer', {
				layer: layers[i]
			});
			this.addLayer(layers[i]);
		}
		this.latLngs = L.KML.getLatLngs(xml);
		this.fire("loaded");
	},

	latLngs: []
});

L.Util.extend(L.KML, {

	parseKML: function (xml, options) {
		var style = this.parseStyle(xml);
		this.parseStyleMap(xml, style);
		var el = xml.getElementsByTagName("Folder");
		var layers = [], l;
		for (var i = 0; i < el.length; i++) {
			if (!this._check_folder(el[i])) { continue; }
			l = this.parseFolder(el[i], style);
			if (l) { layers.push(l); }
		}
		el = xml.getElementsByTagName('Placemark');
		for (var j = 0; j < el.length; j++) {
			if (!this._check_folder(el[j])) { continue; }
			l = this.parsePlacemark(el[j], xml, style);
			if (l) { layers.push(l); }
		}
		el = xml.getElementsByTagName('GroundOverlay');
		for (var j = 0; j < el.length; j++) {
			l = this.parseGroundOverlay(el[j], style, options);
			if (l) { layers.push(l); }
		}		
		return layers;
	},

	// Return false if e's first parent Folder is not [folder]
	// - returns true if no parent Folders
	_check_folder: function (e, folder) {
		e = e.parentElement;
		while (e && e.tagName !== "Folder")
		{
			e = e.parentElement;
		}
		return !e || e === folder;
	},

	parseStyle: function (xml) {
		var style = {};
		var sl = xml.getElementsByTagName("Style");

		//for (var i = 0; i < sl.length; i++) {
		var attributes = {color: true, width: true, Icon: true, href: true,
						  hotSpot: true};

		function _parse(xml) {
			var options = {};
			for (var i = 0; i < xml.childNodes.length; i++) {
				var e = xml.childNodes[i];
				var key = e.tagName;
				if (!attributes[key]) { continue; }
				if (key === 'hotSpot')
				{
					for (var j = 0; j < e.attributes.length; j++) {
						options[e.attributes[j].name] = e.attributes[j].nodeValue;
					}
				} else {
					var value = e.childNodes[0].nodeValue;
					if (key === 'color') {
						options.opacity = parseInt(value.substring(0, 2), 16) / 255.0;
						options.color = "#" + value.substring(6, 8) + value.substring(4, 6) + value.substring(2, 4);
					} else if (key === 'width') {
						options.weight = value;
					} else if (key === 'Icon') {
						ioptions = _parse(e);
						if (ioptions.href) { options.href = ioptions.href; }
					} else if (key === 'href') {
						options.href = value;
					}
				}
			}
			return options;
		}

		for (var i = 0; i < sl.length; i++) {
			var e = sl[i], el;
			var options = {}, poptions = {}, ioptions = {};
			el = e.getElementsByTagName("LineStyle");
			if (el && el[0]) { options = _parse(el[0]); }
			el = e.getElementsByTagName("PolyStyle");
			if (el && el[0]) { poptions = _parse(el[0]); }
			if (poptions.color) { options.fillColor = poptions.color; }
			if (poptions.opacity) { options.fillOpacity = poptions.opacity; }
			el = e.getElementsByTagName("IconStyle");
			if (el && el[0]) { ioptions = _parse(el[0]); }
			if (ioptions.href) {
				// save anchor info until the image is loaded
				options.icon = new L.KMLIcon({
					iconUrl: ioptions.href,
					shadowUrl: null,
					iconAnchorRef: {x: ioptions.x, y: ioptions.y},
					iconAnchorType:	{x: ioptions.xunits, y: ioptions.yunits}
				});
			}
			style['#' + e.getAttribute('id')] = options;
		}
		return style;
	},
	
	parseStyleMap: function (xml, existingStyles) {
		var sl = xml.getElementsByTagName("StyleMap");
		
		for (var i = 0; i < sl.length; i++) {
			var e = sl[i], el;
			var smKey, smStyleUrl;
			
			el = e.getElementsByTagName("key");
			if (el && el[0]) { smKey = el[0].textContent; }
			el = e.getElementsByTagName("styleUrl");
			if (el && el[0]) { smStyleUrl = el[0].textContent; }
			
			if (smKey=='normal')
			{
				existingStyles['#' + e.getAttribute('id')] = existingStyles[smStyleUrl];
			}
		}
		
		return;
	},

	parseFolder: function (xml, style) {
		var el, layers = [], l;
		el = xml.getElementsByTagName('Folder');
		for (var i = 0; i < el.length; i++) {
			if (!this._check_folder(el[i], xml)) { continue; }
			l = this.parseFolder(el[i], style);
			if (l) { layers.push(l); }
		}
		el = xml.getElementsByTagName('Placemark');
		for (var j = 0; j < el.length; j++) {
			if (!this._check_folder(el[j], xml)) { continue; }
			l = this.parsePlacemark(el[j], xml, style);
			if (l) { layers.push(l); }
		}
		if (!layers.length) { return; }
		if (layers.length === 1) { return layers[0]; }
		return new L.FeatureGroup(layers);
	},

	parsePlacemark: function (place, xml, style) {
		var i, j, el, options = {};
		el = place.getElementsByTagName('styleUrl');
		for (i = 0; i < el.length; i++) {
			var url = el[i].childNodes[0].nodeValue;
			for (var a in style[url])
			{
				// for jshint
				if (true)
				{
					options[a] = style[url][a];
				}
			}
		}
		var layers = [];

		var parse = ['LineString', 'Polygon', 'Point'];
		for (j in parse) {
			// for jshint
			if (true)
			{
				var tag = parse[j];
				el = place.getElementsByTagName(tag);
				for (i = 0; i < el.length; i++) {
					var l = this["parse" + tag](el[i], xml, options);
					if (l) { layers.push(l); }
				}
			}
		}

		if (!layers.length) {
			return;
		}
		var layer = layers[0];
		if (layers.length > 1) {
			layer = new L.FeatureGroup(layers);
		}

		var name, descr = "";
		el = place.getElementsByTagName('name');
		if (el.length && el[0].childNodes.length) {
			name = el[0].childNodes[0].nodeValue;
		}
		el = place.getElementsByTagName('description');
		for (i = 0; i < el.length; i++) {
			for (j = 0; j < el[i].childNodes.length; j++) {
				descr = descr + el[i].childNodes[j].nodeValue;
			}
		}

		if (name) {
			layer.bindPopup("<h2>" + name + "</h2>" + descr);
		}

		return layer;
	},

	parseCoords: function (xml) {
		var el = xml.getElementsByTagName('coordinates');
		return this._read_coords(el[0]);
	},

	parseLineString: function (line, xml, options) {
		var coords = this.parseCoords(line);
		if (!coords.length) { return; }
		return new L.Polyline(coords, options);
	},

	parsePoint: function (line, xml, options) {
		var el = line.getElementsByTagName('coordinates');
		if (!el.length) {
			return;
		}
		var ll = el[0].childNodes[0].nodeValue.split(',');
		return new L.KMLMarker(new L.LatLng(ll[1], ll[0]), options);
	},

	parsePolygon: function (line, xml, options) {
		var el, polys = [], inner = [], i, coords;
		el = line.getElementsByTagName('outerBoundaryIs');
		for (i = 0; i < el.length; i++) {
			coords = this.parseCoords(el[i]);
			if (coords) {
				polys.push(coords);
			}
		}
		el = line.getElementsByTagName('innerBoundaryIs');
		for (i = 0; i < el.length; i++) {
			coords = this.parseCoords(el[i]);
			if (coords) {
				inner.push(coords);
			}
		}
		if (!polys.length) {
			return;
		}
		if (options.fillColor) {
			options.fill = true;
		}
		if (polys.length === 1) {
			return new L.Polygon(polys.concat(inner), options);
		}
		return new L.MultiPolygon(polys, options);
	},

	getLatLngs: function (xml) {
		var el = xml.getElementsByTagName('coordinates');
		var coords = [];
		for (var j = 0; j < el.length; j++) {
			// text might span many childnodes
			coords = coords.concat(this._read_coords(el[j]));
		}
		return coords;
	},

	_read_coords: function (el) {
		var text = "", coords = [], i;
		for (i = 0; i < el.childNodes.length; i++) {
			text = text + el.childNodes[i].nodeValue;
		}
		text = text.split(/[\s\n]+/);
		for (i = 0; i < text.length; i++) {
			var ll = text[i].split(',');
			if (ll.length < 2) {
				continue;
			}
			coords.push(new L.LatLng(ll[1], ll[0]));
		}
		return coords;
	},
	
	//note that 'options' is passed through to parseKML so that it can reach parseGroundOverlay which uses it
	//to look for customizations to the groundOverlay, specficially if a bounding box should be drawn with a PopUp
	// * New options that can be passed through for processing of GroundOverlay tags are
	// options['imageOverlayBoundingBoxCreatePopUp'] = true|false
	// options['imageOverlayBoundingBoxDrawOptions'] = {L.PopUp.options}   example:
	//		options['imageOverlayBoundingBoxDrawOptions'] = {stroke: true, weight: 2, fillOpacity: 0.05,clickable: true}
	parseGroundOverlay: function (overlay, style, options) {
		var i, j, el;
		var blobURLs=[];  //keeps track of blob URLs created by KMZ processor for contained image files, these need to be release when the object is removed from the map

		// Parse out the Icon, href and Color tags (for opacity)
		var overlayOptions = _parse(overlay);  
		
		//Get the co-ordinates and create latLonBox for this image
		var south, west, north, east, rotation, latLonBox;
		el = overlay.getElementsByTagName('LatLonBox');
		for (i = 0; i < el.length; i++) 
		{	for (j = 0; j < el[i].childNodes.length; j++) 
			{
				if (el[i].childNodes[j].tagName == 'north')
				{	north = el[i].childNodes[j].textContent;	} 
				else if (el[i].childNodes[j].tagName == 'south')
				{	south = el[i].childNodes[j].textContent;	}
				else if (el[i].childNodes[j].tagName == 'east')
				{	east = el[i].childNodes[j].textContent;	}
				else if (el[i].childNodes[j].tagName == 'west')
				{	west = el[i].childNodes[j].textContent;	}
//				else if (el[i].childNodes[j].tagName == 'rotation')
//				{	//Possibly add support to rotate the image outside of Leaflet, look into how the other plugins are doing it	}
			}
		}
		latLonBox =  new L.LatLngBounds([ new L.LatLng(south, west), new L.LatLng(north, east) ]);
		
		//Create the ImageOverlay
		var imgOverlay = new L.ImageOverlay( overlayOptions.href, latLonBox, new Array().concat(options, overlayOptions)  );
		
		//Extend the ImageOverlay Object to have a getBounds method so that we can call L.Map.fitBounds on it later
		L.Util.extend(imgOverlay, {getBounds: function() {   return this._bounds; } });
		
		
		var layers = [];
		if (imgOverlay) 
		{ layers.push(imgOverlay); }

		if (!layers.length) 
		{	return;	}
		
		var layer = new L.FeatureGroup(layers);	
		
		//Since LeafletJS doesn't provide a means of having a PopUp box on a ImageOverlay
		//this option - passed through at L.KMZ creationg allows for a L.Polygon to be created
		//With various formatting options passed along (set weight, opacity, clickable) a
		//L.PopUp can be bound to the surrounding areas, alas you have to click on the box borders sometimes
		//but not at other times which is very odd.
		if (options.imageOverlayBoundingBoxCreatePopUp==true)
		{	var name, descr = "";
			
			el = overlay.getElementsByTagName('name');
			if (el.length) 
			{	name = el[0].childNodes[0].nodeValue;	}
			
			el = overlay.getElementsByTagName('description');
			for (i = 0; i < el.length; i++) {
				for (j = 0; j < el[i].childNodes.length; j++) {
					descr = descr + el[i].childNodes[j].nodeValue;
				}
			}
			
			var imageOverlayBoundingBoxDrawOptions = (options.imageOverlayBoundingBoxDrawOptions) ? options.imageOverlayBoundingBoxDrawOptions : {}; 
			var hiddenPoly = new L.Polygon(	[ new L.LatLng(south, west), new L.LatLng(south, east), 
			                               	  new L.LatLng(north, east), new L.LatLng(north, west) ], 
											imageOverlayBoundingBoxDrawOptions);
			if (name) 
			{	hiddenPoly.bindPopup('<h2>' + name + '</h2>' + descr);	}
			
			layer.addLayer(hiddenPoly);
		}

		if (blobURLs.length > 0)
		{	//Setup a listener to remove the blobs from memory by their blob:/ URLs when this feature group is removed from the map
			//Todo: This doesn't appear to fire correctly though, needs some investigation as to why.
			layer.on(	'layerremove', 	
					function()	
					{	console.log('In Blob onLayerRemove Event Handler');
					
						// Remove the blobs for each image loaded as a blob by L.KMZ
						blobURLs.forEach( 	function(blobURL) 	
											{	URL.revokeObjectURL(blobURL);
												console.log('Removed Blob URL:', blobURL);
											} ); 
						
						URL.revokeObjectURL(this.options['kmlBlob']);  // Remove the blob containing the KML document
						
					}, this);
		}
		
		return layer;

		
		//Utility inner function to parse out the Icon, href and Color tags
		//Also keeps track of any 'blob:' URLs it runs into for future memory release when the layer is removed from the map
		function _parse(xml) {
			var options = {};
			for (var i = 0; i < xml.childNodes.length; i++) 
			{	
				var e = xml.childNodes[i];
				var key = e.tagName;
				if (key)
				{
					var value = e.childNodes[0].nodeValue;
					if (key === 'color') {
						options.opacity = parseInt(value.substring(0, 2), 16) / 255.0;
						options.color = "#" + value.substring(6, 8) + value.substring(4, 6) + value.substring(2, 4);
					} 
					else if (key === 'Icon') 
					{	ioptions = _parse(e);
						if (ioptions.href) 
						{	options.href = ioptions.href;	}
					} 
					else if (key === 'href') 
					{	if (value.substr(0,5).toLowerCase() == 'blob:')
						{	blobURLs.push(value);		  //keep track of this blob URL to release the memory when this layer is removed from the map
							options.href = value;
						}
						else if (value.substr(0,5).toLowerCase() == 'http:')
						{	options.href = value;	}
//						else if ( (options['baseURL']) && (options['baseURL'].length > 0))
//						{	var baseUrl = options['baseURL'].substr(0, options['baseURL'].lastIndexOf('/') + 1);
//							options.href = baseUrl + value;	
//							console.log('I SET THE BASE URL:', options.href);
//						}
						else	
						{	options.href = value;	}
					}
				}
			}
			return options;
		};
	}

});

L.KMLIcon = L.Icon.extend({

	createIcon: function () {
		var img = this._createIcon('icon');
		img.onload = function () {
			var i = new Image();
			i.src = this.src;
			this.style.width = i.width + 'px';
			this.style.height = i.height + 'px';

			if (this.anchorType.x === 'UNITS_FRACTION' || this.anchorType.x === 'fraction') {
				img.style.marginLeft = (-this.anchor.x * i.width) + 'px';
			}
			if (this.anchorType.y === 'UNITS_FRACTION' || this.anchorType.x === 'fraction') {
				img.style.marginTop  = (-(1 - this.anchor.y) * i.height) + 'px';
			}
			this.style.display = "";
		};
		return img;
	},

	_setIconStyles: function (img, name) {
		L.Icon.prototype._setIconStyles.apply(this, [img, name])
		// save anchor information to the image
		img.anchor = this.options.iconAnchorRef;
		img.anchorType = this.options.iconAnchorType;
	}
});


L.KMLMarker = L.Marker.extend({
	options: {
		icon: new L.KMLIcon.Default()
	}
});
