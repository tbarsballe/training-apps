/**
 * S301 S5.7
 *
 * @require WFSBBOXLoader.js
 * @require Style.js
 * @require Map.js
 */

// ========= config section ================================================
var url = '/geoserver/ows?';
var srsName = 'EPSG:900913';
var center = [-10764594.758211, 4523072.3184791];
var zoom = 3;
var infoFormat = 'application/vnd.ogc.gml/3.1.1'; // can also be 'text/html'

var layers = [
    getStyleLayer()
  ];
var controls = [
    new app.StyleControl({
      featurePrefix:'ne',
      featureType:'states_provinces_shp'
    })
  ];
var overlays = [];
var registrationFunctions = [];


// override the axis orientation for WMS GetFeatureInfo
var proj = new ol.proj.Projection({
  code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
  axis: 'enu'
});
ol.proj.addEquivalentProjections([ol.proj.get('EPSG:4326'), proj]);
// =========================================================================

$("span.app-title").html("SU301 Section 5.7: Styling");
createMap(layers, controls, overlays, registrationFunctions);

