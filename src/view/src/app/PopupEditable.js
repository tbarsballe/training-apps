if (!window.app) {
  window.app = {};
}
var app = window.app;

/**
 * @class
 * A popup that can be used to show or edit information about a feature. Not compatible with Popup.js
 * The map is the core component of OpenLayers. In its minimal configuration it
 * needs an element (a div that is normally a child of the map div):
 *
 *     var popup = new app.Popup({
 *       element: document.getElementById('popup')
 *     });
 *
 * A more complete configuration would be:
 *
 *     var popup = new app.Popup({
 *       element: document.getElementById('popup'),
 *       closeBox: true,
 *       offsetY: -25,
 *       autoPan: true
 *     });
 *
 * `closeBox` will determine whether or not an x will be shown which on click
 * close the popup.
 * `offsetX` and `offsetY` are offsets to be applied to the positioning of the
 * popup overlay.
 * `autoPan` will determine if the map will automatically be panned if the
 * popup is not completely visible.
 * The popup is added to the map by using the `overlays` configuration option
 * of the map.
 *
 * @constructor
 * @extends {ol.Overlay}
 * @param {Object} options Options.
 */
app.Popup = function(options) {
  this.autoPan = options.autoPan !== undefined ? options.autoPan : false;
  this.margin = options.margin !== undefined ? options.margin : 10;
  ol.Overlay.call(this, options);
  var me = this;
  if (options.closeBox === true) {
    $('<a href="#" id="popup-closer" class="ol-popup-closer"></a>').click(
      this.getElement(), function(evt) {
        $(me).trigger('close');
        evt.data.style.display = 'none';
        evt.target.blur();
        return false;
      }).appendTo($(this.getElement()));
  }
  $('<div id="popup-content"></div>').appendTo($(this.getElement()));
};

ol.inherits(app.Popup, ol.Overlay);

/**
 * Set the content to be shown in the popup.
 * @param {string} content The content to be shown.
 */
app.Popup.prototype.setContent = function(content) {
  $(this.getElement()).find("#popup-content").html(content);
};

app.Popup.prototype.setFeature = function(ns, prefix, type, feature) {
  this.featureNS = ns;
  this.featurePrefix = prefix;
  this.featureType = type;
  this.feature = feature;
};

app.Popup.prototype.setEditing = function(editing) {
  if (editing) {
    $(this.getElement()).find(".feature-info-static").css("display", "none");
    $(this.getElement()).find(".feature-info-edit").css("display", "");
  } else {
    $(this.getElement()).find(".feature-info-static").css("display", "");
    $(this.getElement()).find(".feature-info-edit").css("display", "none");
  }
};

app.Popup.prototype.updateContent = function(doSave) {
  var table = $(this.getElement()).find(".feature-info-table");
  var keys = $(table).find(".feature-info-key");
  var values = $(table).find(".feature-info-static");
  var inputs = $(table).find(".feature-info-edit");

  var feature = this.feature;
  var format = new ol.format.WFS({featureNS: this.featureNS, featureType: this.featureType, gmlFormat: infoFormat});

  var properties = {};
  for (var i = 0; i < keys.length; i++) {
    var key = $(keys[i]).text();
    var value = $(values[i]).text();
    var input = $(inputs[i]).val();
    if (doSave) {
      $(values[i]).html(input);
      if (value != input) {
        properties[key] = input;
      }
    } else {
      $(inputs[i]).val(value);
    }
  }
  if (doSave) {
    feature.setProperties(properties);
    var updates = new ol.Feature(properties);
    updates.setId(feature.getId());
    var wfs = format.writeTransaction([], [updates], [], 
      {featureNS: this.featureNS, featurePrefix: this.featurePrefix, featureType: this.featureType});

    //TODO ajax post
    $.ajax({
            url: url,
            contentType:"application/xml",
            processData: false,
            type: "POST",
            data: '<Transaction service="WFS" version="1.1.0">'+$(wfs).html()+'</Transaction>', // send the xml content as text
            success: function(response){
              var result = format.readTransactionResponse(response);
              if (result.transactionSummary.totalUpdated != Object.keys(properties).length) {
                alert("WFS-T Transaction Failed!");
              }
            },
            error: function(response) {
              alert("WFS-T Transaction Failed!");
            }
        });
  }
}

/**
 * Show this popup.
 */
app.Popup.prototype.show = function() {
  $(this.getElement()).show();
};

/**
 * Hide this popup.
 */
app.Popup.prototype.hide = function() {
  $(this.getElement()).hide();
};

/**
 * Set the position for this overlay.
 * @param {ol.Coordinate|undefined} position Position.
 */
app.Popup.prototype.setPosition = function(position) {
  ol.Overlay.prototype.setPosition.call(this, position);
  if (this.autoPan === true) {
    var map = this.getMap();
    var el = this.getElement();
    var margin = this.margin;
    window.setTimeout(function() {
      var resolution = map.getView().getResolution();
      var center = map.getView().getCenter();
      var popupOffset = $(el).offset();
      var mapOffset = $(map.getTarget()).offset();
      var offsetY = popupOffset.top - mapOffset.top;
      var mapSize = map.getSize();
      var offsetX = (mapOffset.left + mapSize[0])-(popupOffset.left+$(el).outerWidth(true));
      if (offsetY < 0 || offsetX < 0) {
        var dx = 0, dy = 0;
        if (offsetX < 0) {
          dx = (margin-offsetX)*resolution;
        }
        if (offsetY < 0) {
          dy = (margin-offsetY)*resolution;
        }
       map.getView().setCenter([center[0]+dx, center[1]+dy]);
      }
    }, 0);
  }
};

//Initialization

// create a new popup with a close box
// the popup will draw itself in the popup div container
// autoPan means the popup will pan the map if it's not visible (at the edges of the map).
var popup = new app.Popup({
  element: document.getElementById('popup'),
  closeBox: true,
  autoPan: true
});

var highlight = {};
var getHighlightLayer = function() {
  // create a vector layer to contain the feature to be highlighted
  highlight = new ol.layer.Vector({
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#00FFFF',
        width: 3
      })
    }),
    meta: true,
    source: new ol.source.Vector()
  });

  // when the popup is closed, clear the highlight
  $(popup).on('close', function() {
    highlight.getSource().clear();
  });
  return highlight;
};


var showPopup = true;

var setShowPopup = function(state) {
  showPopup = state;
}

var registerPopup = function(map) {
  // register a single click listener on the map and show a popup
  // based on WMS GetFeatureInfo
  map.on('singleclick', function(evt) {
    if (!showPopup) {
      return;
    }

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
              //TODO: Add div for edit / save / cancel

              var body = $('<div>');
              var menubar = $('<div class="popup-header">');
              $('<a class="feature-info-static"/>').html('<i class="fa fa-pencil"/>').click([], function() {
                popup.setEditing(true);
              }).appendTo(menubar);
              $('<a class="feature-info-edit"/>').html('<i class="fa fa-save"/>').click([], function() {
                popup.updateContent(true);
                popup.setEditing(false);
              }).appendTo(menubar);
              $('<a class="feature-info-edit"/>').html('<i class="fa fa-times-circle-o"/>').click([], function() {
                popup.updateContent(false);
                popup.setEditing(false);
              }).appendTo(menubar);

              $(menubar).appendTo(body);
              
              var values = feature.getProperties();
              var hasContent = false;
              var html = '';
              for (var key in values) {
                //TODO: Make fields editable
                if (key !== 'the_geom' && key !== 'boundedBy') {

                  html += '<tr><td><span class="feature-info-key">' + key + '</span></td>'+
                          '<td><span class="feature-info-static">' + values[key] + '</span>'+
                          '<input type="text" class="feature-info-edit" value="' + values[key] + '"></input></td></tr>';
                  hasContent = true;
                }
              }
              var table = $('<table class="popup-body feature-info-table table table-striped table-bordered table-condensed">').html(html);
              $(table).appendTo(body);


              if (hasContent === true) {
                popup.setPosition(evt.coordinate);
                popup.setContent(body);
                popup.setFeature(ns, name[0], name[1], feature);
                popup.setEditing(false);
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
        
    } else {
      popup.hide();
    }
  });
};
