/*
 * v0.1 by Owen Peterson - 2013-11-19
 * extends the work of Pavel Shramov: https://github.com/shramov/leaflet-plugins
 * 
 * Initial implementation processing in local browser memory of the download and unzipping of KMZ files
 * for presentation in LeafletJS (tested with v0.64 and v0.7
 * 
 * Uses zip.js from: http://gildas-lormeau.github.com/zip.js/
 * As required by zip.js, set the global variable below to the correct path: 
 * 		zip.workerScriptsPath = 'zip/';
 * 
 * 
 * New options that can be passed through L.KMZ to L.KML for processing of GroundOverlay tags are
 * options['imageOverlayBoundingBoxCreatePopUp'] = true|false
 * options['imageOverlayBoundingBoxDrawOptions'] = {L.PopUp.options}   example:
 * 		options['imageOverlayBoundingBoxDrawOptions'] = {stroke: true, weight: 2, fillOpacity: 0.05,clickable: true}
 * 
 */


/*global L: true */


L.KMZ = L.KML.extend({	

	initialOptions: {},
	
	//Accepts a http URL to a KMZ or KML file, an array of options as defined above, and a fileType header allowing for
	//pass through of KML
	initialize: function(kmzURL, options, fileType) {
		options['baseURL'] = kmzURL;
		L.Util.setOptions(this, options);
		initialOptions = options;
		this._layers = {};
		var _this = this;
		fileType = fileType.toLowerCase();
		
		if (fileType == 'kmz') 
		{	this.loadKMZ(kmzURL, options, 	function(oEvent) 
											{	var blob = oEvent.target.response;
//												console.log('KMZ blob size: ', blob.size);
												_this.unZipAndProcessKMZ(blob, _this);
											},
											this.options.async);
		}
		else if (fileType == 'kml')  //bypass the KMZ process in the event that a 
		{	this.initializeKML(kmzURL, options);	}
	},
	
	//Copied the initialize method from L.KML and changed the name so it can be called once doc.kml is
	//unzipped and modified for local memory (blob:/) references to the contained images
	//from here it calls the existing L.KML to process this KML file.  L.KML.processGroundOverlay has
	//been added to support the ground overlay options.  I chose to put this support here as KML files
	//that come from a website without fist being bundled in a KMZ can still contain HTTP referenced
	//GroundOverlay images.
	initializeKML: function(kml, options) {
		options['baseURL'] = kml;
		L.Util.setOptions(this, options);
		this._kml = kml;
		this._layers = {};
		
		
		if (kml) {
			this.addKML(kml, options, this.options.async);
		}
	},
	
	loadKMZ: function (url, options, cb, async) {
    		
		var loadedKMZ;
		
		if (async == undefined) async = this.options.async;
		if (options == undefined) options = this.options;
		
		var req = new window.XMLHttpRequest();
		
		req.open('GET', url, async);
		req.setRequestHeader('Content-Type', 'application/vnd.google-earth.kmz');
		req.responseType = "blob";
//		console.log('requesting: ', url);
		req.onload = cb;
		req.send();
	},
    		
	unZipAndProcessKMZ: function (blob, _this)
	{
		zip.createReader(	new zip.BlobReader(blob),
							function(reader) 
							{	// get all entries from the zip
								reader.getEntries(	function(entries) 
													{	_this.parseTransformKMZ(entries, _this);	}
												 );
							}, 
							function(error) {/* onerror callback */ }
		);
	},
	
	// Utility function to find a filename in the collection of files/directories found in the zip file
	findFileByName: function(entries, filename, findExact)
	{	filename = filename.toLowerCase();
		var entryFound;
	
		if (entries.some(	function (entry)
							{
								if (findExact && !entry.directory && entry.filename.toLowerCase() == filename)
								{	entryFound = entry;
									return true;
								}
								else if (!findExact && !entry.directory && entry.filename.toLowerCase().indexOf(filename) != -1)
								{	entryFound = entry;
									return true;
								}
							} ) == true )
		{	return entryFound;	}
		return false;
	},
	
	parseTransformKMZ: function(entries, _this) 
	{
		// Processing workflow, assuming the KMZ has already been unzipped
		//Step 1: find doc.kml
		//Step 1.1: Get as text-string						
		//Step 2: parse this KML looking for all instances of href which are relative
		//Step 2.1: for each of these relative references find the file in the zip file
		//Step 2.1.1: then create a blob for the image
		//Step 2.1.2: create a URL obj/reference to this image
		//Step 2.1.3: replace the href with the blob://URL....
		//Step 2.1.4: now take the modified KML text and turn it into a blob: reference
		//Step 3: call L.KML to parse this modified KML with blob: references to locally stored images

		//Step 1: find doc.kml
		var docKMLentry = _this.findFileByName(entries, '.kml', false);
//		console.log('in Parse file: ', docKMLentry.filename);
		
		docKMLentry.getData(	new zip.BlobWriter('text/xml'),
								function(kmlText) 
								{
									//Step 1.1: Get as text-string
									var fileReader = new FileReader();
									fileReader.addEventListener("loadend",  function() 
																			{	//console.log('RESULT AS TEXT:', fileReader.result);
																				_this.parseDocKML(fileReader.result, entries, _this);
																			}
																);
									fileReader.readAsText(kmlText);
								},
								function(current, total) {/* onprogress callback */ }
			 );

		var docKmlText;
	},

				
     parseDocKML: function(docKML, entries, _this)
     {
    	 docKmlText = docKML;
		// Step 2: parse this KML looking for all instances of href which are relative
    	 
//    	console.log('setting up callbacks;');
    	
		var afterAllHrefUnzip = function (alloutput)
		{
//	    	console.log('After all callbacks on href links in zip file', alloutput);
	    	for (var pathFileName in alloutput)
	    	{	//Step 2.1.2: create a URL obj/reference to this image
	    		var href = alloutput[pathFileName];
	    		var url = URL.createObjectURL(href);
	    		
	    		//Step 2.1.3: replace the href with the blob://URL....
	    		docKmlText = docKmlText.replace('<href>' + pathFileName + '</href>', '<href>' + url + '</href>' );
	    	}
	    	
	    	var docKMLasBlob = new Blob([docKmlText], {type: 'text/xml'});

	    	initialOptions['async'] = true;
	    	initialOptions['urlIsBlob'] = true;

	    	//Step 2.1.4: now take the modified KML text and turn it into a blob: reference
	    	//Step 3: call L.KML to parse this modified KML with blob: references to locally stored images
	    	_this.initializeKML(URL.createObjectURL(docKMLasBlob), initialOptions);
	    };

	    var cbGenerator = _this.getGroupCallBackGenerator(30000, afterAllHrefUnzip);
		
		xml=_xml._str2xml(docKML);
		var hrefs = xml.getElementsByTagName("href");
		for (var i = 0; i < hrefs.length; i++) 
		{	
//			console.log('href found: ' + hrefs[i] + ' ' + hrefs[i].textContent);
			
			if (hrefs[i].textContent.toLowerCase().indexOf('http') == -1)
			{
				//Step 2.1: for each of these relative references find the file in the zip file
				var hrefZip = _this.findFileByName(entries, hrefs[i].textContent, true);
				var fileExtension = hrefs[i].textContent.split(".").pop().toLowerCase();
				hrefZip.getData(	new zip.BlobWriter('image/' + fileExtension),
									cbGenerator.getCallback(hrefs[i].textContent),
									function(current, total) {/* onprogress callback */ }
								);
			}
		}
		
		cbGenerator.start();
     },

	//getGroupCallBackGenerator courtesy of: https://gist.github.com/markandey/4350633
     getGroupCallBackGenerator: function(timeOut,finalCallback)
     {
		var waitingStatus={};
		var resultObject={};
		var started=false;
		var timedOut=false;
		var timer=setTimeout(function(){
			timedOut=true;
			if(typeof(finalCallback)=="function"){
					finalCallback(resultObject);
			}
			timer=false;
		},timeOut);

		function isAllDone(){
			for(var ins in waitingStatus){
				if(waitingStatus.hasOwnProperty(ins)){
					if(waitingStatus[ins]){
						return false;;
					}
				}
			}
			return true;
		}
		function tryToTriggerFinalCallback(){
			if(!isAllDone()){
				return;
			}
			if(timedOut){
				return;
			}
			if(!started){
				return;
			}
			if(typeof(finalCallback)=="function"){
				if(timer){
					clearTimeout(timer);
					timer=false;
				}
				finalCallback(resultObject);
			}
		}
		return {
				'getCallback':function (instanceName){
					if(waitingStatus[instanceName]!==undefined){
						throw "Duplicate Instance Name, While Generating the Callback...";
					}
   				waitingStatus[instanceName]=true;
   				return function(r){
   					resultObject[instanceName]=r||{};
   					waitingStatus[instanceName]=false;
   					tryToTriggerFinalCallback();
   				}
   			},
   			'start':function (){
   				started=true;
   				tryToTriggerFinalCallback();
   			},
   			'abort':function(){
   				started=false;
   			}
		}
     }
     
    
 
});
