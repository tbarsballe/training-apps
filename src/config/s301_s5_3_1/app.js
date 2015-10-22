/**
 * S301 S5.3 - 1
 *
 * @require LayersControl.js
 * @require Map.js
 */

// ========= config section ================================================
var url = '/geoserver/ows?';
var srsName = 'EPSG:900913';
var center = [-10764594.758211, 4523072.3184791];
var zoom = 3;
var infoFormat = 'application/vnd.ogc.gml/3.1.1'; // can also be 'text/html'

var layers = [
    //OSM
    new ol.layer.Tile({
      title: 'OpenStreetMap',
      group: "background",
      source: new ol.source.OSM()}),
    // MapQuest streets
    new ol.layer.Tile({
      title: 'MapQuest Street Map',
      group: "background",
      source: new ol.source.MapQuest({layer: 'osm'})
    })
  ];
var controls = [
    new app.LayersControl({
      groups: {
        background: {
          title: "Base Layers",
          exclusive: true
        },
        'default': {
          title: "Overlays"
        }
      }
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

$("span.app-title").html("SU301 Section 5.3: Basemaps");
createMap(layers, controls, overlays, registrationFunctions);


