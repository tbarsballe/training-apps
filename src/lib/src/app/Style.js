if (!window.app) {
  window.app = {};
}
var app = window.app;

/*
 * rules: {
 *   i: {
 *     fill: {r:Number,g:Number,b:Number,a:Number},
 *     stroke: {r:Number,g:Number,b:Number,a:Number},
 *     text: {String | Function}
 *     filter: {Function}
 *   }
 * }
 *
 */

var rules = {};
var nextId = 1;
var getNextId = function() {
  return nextId++;
};



var styleFunction = function(feature, resolution) {
  var style_opts = {};

  var rulesElements = $('.style-rule');
  //Apply rules in order of appearance. Latter rules will overwrite earlier ones.
  for (var j = 0; j < rulesElements.length; j++) {
    var i = parseInt($(rulesElements[j]).attr('id').split('-')[1]);
    var rule = rules[i];

    if (rule.filter(feature)) {
      if (rule.fill && rule.fill.a != 0) {
        style_opts.fill = new ol.style.Fill({color: [rule.fill.r,rule.fill.g,rule.fill.b,rule.fill.a]});
      }
      if (rule.stroke && rule.stroke.a != 0) {
        style_opts.stroke = new ol.style.Stroke({color: [rule.stroke.r,rule.stroke.g,rule.stroke.b,rule.stroke.a]});
      }
      if (rule.text) {
        if ($.isFunction(rule.text)) {
          style_opts.text = new ol.style.Text({
            text: rule.text(feature),
            fill: new ol.style.Fill([0,0,0,1]),
            stroke: new ol.style.Stroke({color: [255,255,255,1], width: 2}),
            font: '10px sans-serif'
          });
        } else {
          style_opts.text = new ol.style.Text({
            text: rule.text,
            fill: new ol.style.Fill([0,0,0,1]),
            stroke: new ol.style.Stroke({color: [255,255,255,1], width: 2}),
            font: '10px sans-serif'
          });
        }
      }
    }

  }

  return [new ol.style.Style(style_opts)];
}

// this is the callback function that will get called when the features are in
var vectorSource = {};
var loadFeatures = function(response) {
  vectorSource.addFeatures(vectorSource.readFeatures(response));
};

var styleLayer = {};
var getStyleLayer = function() {
  var vector = new ol.layer.Vector({
    source: new ol.source.Vector(),
    meta: true,
    style: styleFunction
    /*new ol.style.Style({
      stroke: new ol.style.Stroke({color: [0, 0, 0, 1]})
    })*/
  });
  styleLayer = vector;
  return styleLayer;
}

/*
 * Style Control
 *
 */


 /*

  Header
  [*] Rule + -                                  //Add a rule after / delete this rule. Cannot delete last rule.
      Filter: [All |v] [####|v] [####|v]
      Fill:   R: [   ] G: [   ] B: [   ] A: [   ]
      Stroke: R: [   ] G: [   ] B: [   ] A: [   ]
      Text:   [Value |v]: [      ] {[    |v]}

      Need handles to all inputs - $().change([],function(){}); function



 */
    //header + inital rule. Add/remove rule function - use unique ids - make rule a map not a list

app.StyleControl = function(opt_options) {
  var options = opt_options || {};
  var element = document.createElement('div');
  $(element).addClass('style-control');

  var header = $('<div class="style-header">Style</div>');
  var rulesScroll = $('<div class="style-scroll"/>');
  var rulesElement = $('<div class="style-body"/>');

  header.appendTo(element);
  rulesScroll.appendTo(element);
  rulesElement.appendTo(rulesScroll);

  //TODO describeFeatureType
  var featureKeys;
  var features;

  var updateLayer = function() {
    styleLayer.getSource().dispatchEvent('change');
  };
  var removeRule = function(id) {
    if (Object.keys(rules).length > 1) {
      $('#rule-'+id).remove();
      delete rules[id];
    }

    //TODO disable (-) button
    if (rules.length == 1) {

    }
  };

  var addRule = function(id, lastRule) {
  
    rules[id] = {
      fill: {r:0,g:0,b:0,a:0.0},
      stroke: {r:0,g:0,b:0,a:1.0},
      text: null,
      filter: function() {return true;}
    };

    var rule = $('<div id="rule-'+id+'" class="style-rule"/>');
    var ruleHeader = $('<div class="rule-header"/>');
    var icon = $('<div/>');
    icon.css('width', '15');
    icon.css('height', '15');
    icon.css('border-style', 'solid');
    icon.css('border-width', '2px');
    icon.css('border-radius', '3px');
    icon.css('display', 'inline-block');

    var updateIcon = function() {
      //TODO Set stroke and fill color rgba()
      icon.css('background-color', 'rgba('+rules[id].fill.r+','+rules[id].fill.g+','+rules[id].fill.b+','+rules[id].fill.a+')');
      icon.css('border-color', 'rgba('+rules[id].stroke.r+','+rules[id].stroke.g+','+rules[id].stroke.b+','+rules[id].stroke.a+')');
    }

    $(icon).appendTo(ruleHeader);
    $('<span class="rule-header-label">Rule</span>').appendTo(ruleHeader);
    $('<a/>').html('<i class="fa fa-plus-circle"/>').click([], function() {
      addRule(getNextId(), rule);
    }).appendTo(ruleHeader);
    $('<a/>').html('<i class="fa fa-minus-circle"/>').click([], function() {removeRule(id);}).appendTo(ruleHeader);

    var ruleBody = $('<div class="rule-body"/>');

    // Fill:   R: [   ] G: [   ] B: [   ] A: [   ]

    var fill = $('<div><span class="rule-row-label">Fill:</span></div>');

    var parseRGB = function(val) {
      return Math.round(Number(val.replace(/[^\d]+/g,'')));
    };
    var parseAlpha = function(val) {
      return Number(val.replace(/[^\d\.]+/g,''));
    };

    $('<span>R:</span>').appendTo(fill);
    $('<input id="fill-r-'+id+'" class="input-rgba" type="text" min="0" max="255" value="0"/>').change([], function() {

      var val = parseRGB($(this).val());
      $(this).val(val);
      rules[id].fill.r=val;
      updateIcon();
      updateLayer();

    }).appendTo(fill);
    $('<span>G:</span>').appendTo(fill);
    $('<input id="fill-g-'+id+'" class="input-rgba" type="text" min="0" max="255" value="0"/>').change([], function() {

      var val = parseRGB($(this).val());
      $(this).val(val);
      rules[id].fill.g=val;
      updateIcon();
      updateLayer();

    }).appendTo(fill);
    $('<span>B:</span>').appendTo(fill);
    $('<input id="fill-b-'+id+'" class="input-rgba" type="text" min="0" max="255" value="0"/>').change([], function() {

      var val = parseRGB($(this).val());
      $(this).val(val);
      rules[id].fill.b=val;
      updateIcon();
      updateLayer();

    }).appendTo(fill);
    $('<span>A:</span>').appendTo(fill);
    $('<input id="fill-a-'+id+'" class="input-rgba" type="text" min="0" max="1" value="0.0"/>').change([], function() {

      var val = parseAlpha($(this).val());
      $(this).val(val);
      rules[id].fill.a=val;
      updateIcon();
      updateLayer();

    }).appendTo(fill);

    // Stroke: R: [   ] G: [   ] B: [   ] A: [   ]

    var stroke = $('<div><span class="rule-row-label">Stroke:</span></div>');

    $('<span>R:</span>').appendTo(stroke);
    $('<input id="stroke-r-'+id+'" class="input-rgba" type="text" min="0" max="255" value="0"/>').change([], function() {

      var val = parseRGB($(this).val());
      $(this).val(val);
      rules[id].stroke.r=val;
      updateIcon();
      updateLayer();

    }).appendTo(stroke);
    $('<span>G:</span>').appendTo(stroke);
    $('<input id="stroke-g-'+id+'" class="input-rgba" type="text" min="0" max="255" value="0"/>').change([], function() {

      var val = parseRGB($(this).val());
      $(this).val(val);
      rules[id].stroke.g=val;
      updateIcon();
      updateLayer();

    }).appendTo(stroke);
    $('<span>B:</span>').appendTo(stroke);
    $('<input id="stroke-b-'+id+'" class="input-rgba" id="stroke-r-'+id+'" type="text" min="0" max="255" value="0"/>').change([], function() {

      var val = parseRGB($(this).val());
      $(this).val(val);
      rules[id].stroke.b=val;
      updateIcon();
      updateLayer();

    }).appendTo(stroke);
    $('<span>A:</span>').appendTo(stroke);
    $('<input id="stroke-a-'+id+'" class="input-rgba" type="text" min="0" max="1" value="1.0"/>').change([], function() {

      var val = parseAlpha($(this).val());
      $(this).val(val);
      rules[id].stroke.a=val;
      updateIcon();
      updateLayer();

    }).appendTo(stroke);

    // Text:   [Value |v]: [      ] {[    |v]}

    var text = $('<div><span class="rule-row-label">Label:</span></div>');

    var textType = $('<select id="text-type-'+id+'"/>').change([], function() {
      $('#text-val-'+id).removeClass('hide');
      $('#text-var-'+id).removeClass('hide');
      if ($(this).val() == 'Text') {
        $('#text-var-'+id).addClass('hide');
      } else {
        $('#text-val-'+id).addClass('hide');
      }
      updateLayer();
    });


    $('<option value="Text" selected="true">Text</option>').appendTo(textType);
    $('<option value="Variable">Variable</option>').appendTo(textType);

    textType.appendTo(text);
    $('<input id="text-val-'+id+'" type="text"/>').change([], function() {
      rules[id].text = $(this).val();
      updateLayer();
    }).appendTo(text);
    var textVar = $('<select id="text-var-'+id+'" class="hide"/>').change([], function() {
      var val = $(this).val();
      rules[id].text = function(feature) {
        return feature.getProperties()[val];
      };
      updateLayer();
    });
    for (var i = 0; i < featureKeys.length; i++) {
      $('<option value="'+featureKeys[i]+'">'+featureKeys[i]+'</option>').appendTo(textVar);
    }
    textVar.appendTo(text);
 
    //Filter

    var filter = $('<div><span class="rule-row-label">Filter:<span></div>');
    var updateFilterFunction = function() {
      var key = $('#filter-key-'+id).val();
      var op = $('#filter-op-'+id).val();
      var val = $('#filter-val-'+id).val();
      rules[id].filter = function(feature) {
        var p = feature.getProperties()[key];
        switch (op) {
          case '>':
            return p > val;
          case '<':
            return p < val;
          case '>=':
            return p >= val;
          case '<=':
            return p <= val;
          case '==':
            return p == val;
          case '!=':
            return p != val;
          case '~':
            return (p == val || p.toString().search(new RegExp(val,'i')) > -1);
          default:
            return true;
        }
      }
      updateLayer();
    }

    var filterKey = $('<select id="filter-key-'+id+'"/>').change([], function() {
      var val = $(this).val();
      if (val == '__MATCH_ALL__') {
        rules[id].filter = function() {
          return true;
        };
        $('#filter-op-'+id).attr('disabled','disabled');
        $('#filter-val-'+id).attr('disabled','disabled');
      } else {
        $('#filter-op-'+id).removeAttr('disabled');
        $('#filter-val-'+id).removeAttr('disabled');
        updateFilterFunction();
      }
      updateLayer();
    });

    $('<option value="__MATCH_ALL__">All</option>').appendTo(filterKey);
    for (var i = 0; i < featureKeys.length; i++) {
      $('<option value="'+featureKeys[i]+'">'+featureKeys[i]+'</option>').appendTo(filterKey);
    }
    var filterOp = $('<select id="filter-op-'+id+'" disabled="true"/>').change([], updateFilterFunction);
    $('<option value="==" selected="true">is equal to</option>').appendTo(filterOp);
    $('<option value="<">is less than</option>').appendTo(filterOp);
    $('<option value=">">is greater than</option>').appendTo(filterOp);
    $('<option value="<=">is less than or equal to</option>').appendTo(filterOp);
    $('<option value=">=">is greater than or equal to</option>').appendTo(filterOp);
    $('<option value="!=">is not equal to</option>').appendTo(filterOp);
    $('<option value="~">contains</option>').appendTo(filterOp);

    var filterVal = $('<input id="filter-val-'+id+'" type="text" disabled="true"/>').change([], updateFilterFunction);

    filterKey.appendTo(filter);
    filterOp.appendTo(filter);
    filterVal.appendTo(filter);

    fill.appendTo(ruleBody);
    stroke.appendTo(ruleBody);
    text.appendTo(ruleBody);
    filter.appendTo(ruleBody);

    ruleHeader.appendTo(rule);
    ruleBody.appendTo(rule);

    if (lastRule) {
      rule.insertAfter(lastRule);
    } else {
      rule.appendTo(rulesElement);
    }
  };

  //get feature type:
  var featurePrefix = options.featurePrefix;
  var featureType = options.featureType;

  //Do WFS describeFeatureType
  $.ajax({
    url: url+'service=WFS&request=DescribeFeatureType&version=1.1.0&typename='+featurePrefix+':'+featureType,
    success: function(data) {
      var xml = $(data);
      var featureNS = $(xml[0].activeElement).attr('targetNamespace');
      var elements = $(xml).find('xsd\\:complexType xsd\\:element');
      var geometryName = 'the_geom';

      featureKeys = [];

      for (var i = 0; i < elements.length; i++) {
        var name = $(elements[i]).attr('name');
        featureKeys.push(name);
      }
      // create a WFS BBOX loader helper
      var BBOXLoader = new app.WFSBBOXLoader({
        url: url,
        featurePrefix: featurePrefix,
        featureType: featureType,
        srsName: srsName,
        callback: loadFeatures
      }); 
      //Create a new vector source
      vectorSource = new ol.source.ServerVector({
        format: new ol.format.GeoJSON({
          defaultDataProjection: srsName,
          geometryName: geometryName
        }),
        loader: $.proxy(BBOXLoader.load, BBOXLoader),
        strategy: ol.loadingstrategy.createTile(new ol.tilegrid.XYZ({
          maxZoom: 19
        })),
        projection: 'EPSG:3857'
      });

      styleLayer.setSource(vectorSource);
      addRule(getNextId());
    }
  });

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};

ol.inherits(app.StyleControl, ol.control.Control); 


