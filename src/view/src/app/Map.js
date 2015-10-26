/*
 * Map creation and utilities
 */



// create the OpenLayers Map object given a list of layers
// we add a layer switcher to the map with two groups:
// 1. background, which will use radio buttons
// 2. default (overlays), which will use checkboxes
var map = {};
var createMap = function (layers, controls, overlays, registrationFunctions) {
  if (map && map.getView) {
    center = map.getView().getCenter();
    zoom = map.getView().getZoom();
  } 
  if (map.getViewport && map.getViewport()) {
    map.getViewport().remove();
  }
  map = new ol.Map({
    controls: ol.control.defaults().extend(controls),
    // add the popup as a map overlay
    overlays: overlays,
    // render the map in the 'map' div
    target: document.getElementById('map'),
    // use the Canvas renderer
    renderer: 'canvas',
    layers: layers,
    // initial center and zoom of the map's view
    view: new ol.View({
      center: center,
      zoom: zoom
    })
  });

  for (var i = 0; i < registrationFunctions.length; i++) {
    registrationFunctions[i](map);
  }

  return map;
}