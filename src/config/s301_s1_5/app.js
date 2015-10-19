/**
 * S301 S1.5
 *
 * @require Popup.js
 * @require LayersControl.js
 * @require Map.js
 */

// ========= config section ================================================
var url = '/geoserver/ows?';
var featurePrefix = 'usa';
var featureType = 'states';
var featureNS = 'http://census.gov';
var srsName = 'EPSG:900913';
var geometryName = 'the_geom';
var geometryType = 'MultiPolygon';
var fields = ['STATE_NAME', 'STATE_ABBR'];
var layerTitle = 'States';
var infoFormat = 'application/vnd.ogc.gml/3.1.1'; // can also be 'text/html'
var center = [-10764594.758211, 4523072.3184791];
var zoom = 3;
// =========================================================================

// override the axis orientation for WMS GetFeatureInfo
var proj = new ol.proj.Projection({
  code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
  axis: 'enu'
});
ol.proj.addEquivalentProjections([ol.proj.get('EPSG:4326'), proj]);

// the tiled WMS source for our local GeoServer layer
var wmsSource = new ol.source.TileWMS({
  url: url,
  params: {'LAYERS': featurePrefix + ':' + featureType, 'TILED': true},
  serverType: 'geoserver'
});

createMap([
  // MapQuest streets
  new ol.layer.Tile({
    title: 'Street Map',
    group: "background",
    source: new ol.source.MapQuest({layer: 'osm'})
  }),
  // MapQuest imagery
  new ol.layer.Tile({
    title: 'Aerial Imagery',
    group: "background",
    visible: false,
    source: new ol.source.MapQuest({layer: 'sat'})
  }),
  // MapQuest hybrid (uses a layer group)
  new ol.layer.Group({
    title: 'Imagery with Streets',
    group: "background",
    visible: false,
    layers: [
      new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'sat'})
      }),
      new ol.layer.Tile({
        source: new ol.source.MapQuest({layer: 'hyb'})
      })
    ]
  }),
  new ol.layer.Tile({
    title: layerTitle,
    name: featurePrefix+':'+featureType,
    source: wmsSource
  }),
  highlight
]);


