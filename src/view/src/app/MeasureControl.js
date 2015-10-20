if (!window.app) {
  window.app = {};
}
var app = window.app;


/**
 * @class
 * A popup that can be used to show a distance or area for a measurement.
 *
 * @constructor
 * @extends {ol.Overlay}
 * @param {Object} options Options.
 */
app.MeasurePopup = function(options) {
  //this.autoPan = options.autoPan !== undefined ? options.autoPan : false;
  //this.margin = options.margin !== undefined ? options.margin : 10;
  ol.Overlay.call(this, options);
  var me = this;
  if (options.closeBox === true) {
    $('<a href="#" id="popup-closer" class="ol-popup-closer"></a>').click(
      this.getElement(), function(evt) {
        if (options.feature) {
          measureSource.removeFeature(options.feature);
        }
        $(me).trigger('close');
        evt.data.style.display = 'none';
        evt.target.blur();
        return false;
      }).appendTo($(this.getElement()));
  }
  $('<div class="popup-content"></div>').appendTo($(this.getElement()));
};

ol.inherits(app.MeasurePopup, ol.Overlay);

/**
 * Set the content to be shown in the popup.
 * @param {string} content The content to be shown.
 */
app.MeasurePopup.prototype.setContent = function(content) {
  $(this.getElement()).find('.popup-content').html(content);
  //document.getElementById('popup-content').innerHTML = content;
};

/**
 * Show this popup.
 */
app.MeasurePopup.prototype.show = function() {
  $(this.getElement()).show();
};

/**
 * Hide this popup.
 */
app.MeasurePopup.prototype.hide = function() {
  $(this.getElement()).hide();
};

/**
 * Set the position for this overlay.
 * @param {ol.Coordinate|undefined} position Position.
 */
app.MeasurePopup.prototype.setPosition = function(position) {
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

/**
 * Measure control
 */
app.MeasureControl = function(opt_options) {
  this.defaultGroup = "default";
  var options = opt_options || {};
  var element = document.createElement('div');
  element.className = 'measure-control ol-unselectable';

  //TODO: onclick show/hide content
  var title = $('<div class="measure-header"/>').html("Measure");
  var content = $('<div class="measure-content"/>');
  var line = $('<div class="measure-line"/>').html("Line").click([],function(evt) {
    if (draw) {
      map.removeInteraction(draw);
    }
    if ($(this).hasClass('measure-active')) {
      $('.measure-line').removeClass('measure-active');
    } else {
      $('.measure-line').removeClass('measure-active');
      $('.measure-area').removeClass('measure-active');

      $(this).addClass('measure-active');
      addInteraction(map, 'LineString');
    }
  });
  var area = $('<div class="measure-area"/>').html("Area").click([],function(evt) {
    if (draw) {
      map.removeInteraction(draw);
    }
    if ($(this).hasClass('measure-active')) {
      $('.measure-area').removeClass('measure-active');
    } else {
      $('.measure-line').removeClass('measure-active');
      $('.measure-area').removeClass('measure-active');

      $(this).addClass('measure-active');
      addInteraction(map, 'Polygon');
    }
  });

  $(content).append(line);
  $(content).append(area);

  $(element).append(title);
  $(element).append(content);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};

ol.inherits(app.MeasureControl, ol.control.Control);


//Initialization
var measureSource = new ol.source.Vector();
/**
 * Currently drawn feature.
 * @type {ol.Feature}
 */
var measureGeometry;

/**
 * The measure tooltip element.
 * @type {Element}
 */
var measurePopupElement;

/**
 * Overlay to show the measurement.
 * @type {ol.Overlay}
 */
var measurePopup;


/**
 * Creates a new measure popup
 */
function createMeasurePopup(map, feature) {
  if (measurePopupElement) {
    measurePopupElement.parentNode.removeChild(measureTooltipElement);
  }
  measurePopupElement = document.createElement('div');
  measurePopupElement.className = 'ol-popup measure-popup';
  measurePopup = new app.MeasurePopup({
    element: measurePopupElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    feature: feature,
    closeBox: true
  });
  /*measurePopup = new ol.Overlay({
    element: measurePopupElement,
    offset: [0, -15],
    positioning: 'bottom-center'
  });*/
  map.addOverlay(measurePopup);
}

/**
 * format length output
 * @param {ol.geom.LineString} line
 * @return {string}
 */
var formatLength = function(line) {
  var length;
  /*if (geodesicCheckbox.checked) {
    var coordinates = line.getCoordinates();
    length = 0;
    var sourceProj = map.getView().getProjection();
    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
      var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
      var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
      length += wgs84Sphere.haversineDistance(c1, c2);
    }
  } else {*/
    length = Math.round(line.getLength() * 100) / 100;
  /*}*/
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) +
        ' ' + 'km';
  } else {
    output = (Math.round(length * 100) / 100) +
        ' ' + 'm';
  }
  return output;
};


/**
 * format length output
 * @param {ol.geom.Polygon} polygon
 * @return {string}
 */
var formatArea = function(polygon) {
  var area;
  /*
  if (geodesicCheckbox.checked) {
    var sourceProj = map.getView().getProjection();
    var geom = /** @type {ol.geom.Polygon} *//*(polygon.clone().transform(
        sourceProj, 'EPSG:4326'));
    var coordinates = geom.getLinearRing(0).getCoordinates();
    area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
  } else { */
    area = polygon.getArea();
  /*}*/
  var output;
  if (area > 10000) {
    output = (Math.round(area / 1000000 * 100) / 100) +
        ' ' + 'km<sup>2</sup>';
  } else {
    output = (Math.round(area * 100) / 100) +
        ' ' + 'm<sup>2</sup>';
  }
  return output;
};

/**
 * Handle pointer move.
 * @param {ol.MapBrowserEvent} evt
 */
var pointerMoveHandler = function(evt) {
  if (evt.dragging) {
    return;
  }
  /** @type {ol.Coordinate|undefined} */
  var tooltipCoord = evt.coordinate;

  if (measureGeometry && measurePopupElement) {
    var output;
    var geom = (measureGeometry.getGeometry());
    if (geom instanceof ol.geom.Polygon) {
      output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof ol.geom.LineString) {
      output = formatLength( /** @type {ol.geom.LineString} */ (geom));
      tooltipCoord = geom.getLastCoordinate();
    }
    measurePopup.setContent(output);
    measurePopup.setPosition(tooltipCoord);
  }
};

var draw; // global so we can remove it later

var registerMeasureControl = function(map) {
  map.on('pointermove', pointerMoveHandler);
};

function addInteraction(map, type) {
  draw = new ol.interaction.Draw({
    source: measureSource,
    type: /** @type {ol.geom.GeometryType} */ (type),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 5,
        stroke: new ol.style.Stroke({
          color: 'rgba(0, 0, 0, 0.7)'
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        })
      })
    })
  });
  map.addInteraction(draw);

  draw.on('drawstart',
      function(evt) {
        // set measureGeometry
        measureGeometry = evt.feature;
        createMeasurePopup(map, evt.feature);
        $(measurePopupElement).css("display", "block");
      }, this);

  draw.on('drawend',
      function(evt) {
        measurePopup.setOffset([0, -7]);
        // unset measureGeometry
        measureGeometry = null;
        // unset tooltip so that a new one can be created
        measurePopupElement = null;
        
      }, this);
}

var getMeasureLayer = function() {
  
  var vector = new ol.layer.Vector({
    source: measureSource,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: '#ffcc33',
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({
          color: '#ffcc33'
        })
      })
    }),
    meta: true
  });

  return vector
};
