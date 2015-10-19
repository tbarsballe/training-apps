/*
 * Map creation and utilities
 */

// create a vector layer to contain the feature to be highlighted
var highlight = new ol.layer.Vector({
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#00FFFF',
      width: 3
    })
  }),
  source: new ol.source.Vector()
});

// when the popup is closed, clear the highlight
$(popup).on('close', function() {
  highlight.getSource().clear();
});

// create a new popup with a close box
// the popup will draw itself in the popup div container
// autoPan means the popup will pan the map if it's not visible (at the edges of the map).
var popup = new app.Popup({
  element: document.getElementById('popup'),
  closeBox: true,
  autoPan: true
});

// create the OpenLayers Map object given a list of layers
// we add a layer switcher to the map with two groups:
// 1. background, which will use radio buttons
// 2. default (overlays), which will use checkboxes
var map = {};
var createMap = function (layers) {
  if (map.getViewport && map.getViewport()) {
    map.getViewport().remove();
  }
  map = new ol.Map({
    controls: ol.control.defaults().extend([
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
    ]),
    // add the popup as a map overlay
    overlays: [popup],
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

  // register a single click listener on the map and show a popup
  // based on WMS GetFeatureInfo
  map.on('singleclick', function(evt) {
    var viewResolution = map.getView().getResolution();

    //Iterate through layers, do a getFeature against each
    var layers = map.getLayers().getArray();
    var urls = [];
    for (var i = 0; i < layers.length; i++) {
      if (layers[i].group != "background" && layers[i].getVisible()) {
        var source = layers[i].getSource();
        if (source.getGetFeatureInfoUrl) {
          var url = {wfsUrl:source.getGetFeatureInfoUrl(
            evt.coordinate, viewResolution, map.getView().getProjection(),
            {'INFO_FORMAT': infoFormat}), layer: layers[i]};
          if (url.wfsUrl) {
            urls.push(url);
          }
        }
      }
    }
    //Grab topmost layer
    if (urls.length > 0) {
      if (infoFormat == 'text/html') {
        popup.setPosition(evt.coordinate);
        popup.setContent('<iframe seamless frameborder="0" src="' + urls[urls.length-1].wfsUrl + '"></iframe>');
        popup.show();
      } else {
        var showFeatures = function(urls, index) {
          $.ajax({
            url: urls[index].wfsUrl,
            success: function(data) {
              var name = urls[index].layer.get('name').split(':');
              var xml = $($.parseXML(data));
              var ns = $(xml[0].activeElement).attr('xmlns:'+name[0]);
              var format = new ol.format.GML({featureNS: ns, featureType: name[1]});
              var features = format.readFeatures(data);
              
              highlight.getSource().clear();
              if (features && features.length >= 1 && features[0]) {
                var feature = features[0];
                var html = '<table class="table table-striped table-bordered table-condensed">';
                var values = feature.getProperties();
                var hasContent = false;
                for (var key in values) {
                  if (key !== 'the_geom' && key !== 'boundedBy') {
                    html += '<tr><td>' + key + '</td><td>' + values[key] + '</td></tr>';
                    hasContent = true;
                  }
                }
                if (hasContent === true) {
                  popup.setPosition(evt.coordinate);
                  popup.setContent(html);
                  popup.show();
                }
                feature.getGeometry().transform('EPSG:4326', 'EPSG:3857');
                highlight.getSource().addFeature(feature);
              } else {
                if (index > 0) {
                  showFeatures(urls, index-1);
                }
                popup.hide();
              }
            }
          });
        };
        showFeatures(urls, urls.length-1);
        
      }
    } else {
      popup.hide();
    }
  });
  return map;
}