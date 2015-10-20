if (!window.app) {
  window.app = {};
}
var app = window.app;
var modal = $('<div class="modal modal-layerlist fade">' +
                '<div class="modal-dialog">' +
                  '<div class="modal-content">' +
                    '<div class="modal-header">' +
                      '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                      '<h4 class="modal-title">Add Layer</h4>' +
                    '</div>' +
                    '<div class="modal-body">' +
                    '</div>' +
                  '</div>' +
                '</div>' +
              '</div>');

/**
 * @class
 * The LayersControl is a layer switcher that can be configured with groups.
 * A minimal configuration is:
 *
 *     new app.LayersControl()
 *
 * In this case, all layers are shown with checkboxes and in a single list.
 * If you want to group layers in separate lists, you can configure the control
 * with a groups config option, for example:
 *
 *     new app.LayersControl({
 *       groups: {
 *         background: {
 *           title: "Base Layers",
 *           exclusive: true
 *         },
 *         default: {
 *           title: "Overlays"
 *         }
 *       }
 *     })
 *
 * Layers that have their 'group' property set to 'background', will be part of
 * the first list. The list will be titled 'Base Layers'. The title is
 * optional. All other layers will be part of the default list. Configure a
 * group with exclusive true to get a radio group.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object} opt_options Options.
 */
app.LayersControl = function(opt_options) {
  this.defaultGroup = "default";
  var options = opt_options || {};
  var element = document.createElement('div');
  element.className = 'layers-control ol-unselectable';
  if (options.groups) {
    this.groups = options.groups;
    if (!this.groups[this.defaultGroup]) {
      this.groups[this.defaultGroup] = {};
    }
  } else {
    this.groups = {};
    this.groups[this.defaultGroup] = {};
  }
  this.containers = {};
  for (var group in this.groups) {
    this.containers[group] = document.createElement('ul');
    $(this.containers[group]).addClass('group-'+group);
    if (this.groups[group].title) {
      var header = document.createElement('div');
      $(header).addClass('ul-header').html(this.groups[group].title);
      if (group != "background") {
        $('<a class="link link-add"/>').html('+')
          .click([group], function(evt) {
            var group = evt.data[0];
            //request layer list from geoserver
            $.ajax({
              url: '/geoserver/ows?service=wms&request=GetCapabilities',
              success: function(data) {
                var xml = $(data);
                var layers = xml.find('Capability > Layer > Layer');

                var layerList = $('<ul/>').html("Layers");

                var addToList = function(evt) {
                  var group = evt.data[0];
                  var name = evt.data[1];
                  var title = evt.data[2];

                  modal.modal("hide");
                  //modal.remove();

                  var wmsSource = new ol.source.TileWMS({
                    url: '/geoserver/ows?',
                    params: {'LAYERS': name.text(), 'TILED': true},
                    serverType: 'geoserver'
                  });

                  var layer = new ol.layer.Tile({
                    title: title.text(),
                    name: name.text(),
                    source: wmsSource
                  });

                  var layers = map.getLayers().getArray();
                  //Insert before the 'highlight' layer
                  //TODO: Fix to insert before all meta layers, based on count in list...
                  layers.splice(layers.length-1, 0, layer);
                  createMap(layers, controls, map.getOverlays(), registrationFunctions);

                };

                for (var i = 0; i < layers.length; i++) {
                  var name = $(layers[i]).find('Name');
                  if (name && name.length) {
                    name = $(name[0]);
                  }
                  var title = $(layers[i]).find('Title');
                  if (title && title.length) {
                    title = $(title[0]);
                  }
                    
                  //Handle nested layers (layer groups)
                  var subLayers = $(layers[i]).children('Layer');
                  if (subLayers && subLayers.length && subLayers.length > 0) {
                    //TODO: make colapsible
                    var subLayersElement = $('<ul/>');
                    for (var j = 0; j < subLayers.length; j++) {
                      var subLayerName = $(subLayers[j]).find('Name');
                      if (subLayerName && subLayerName.length) {
                        subLayerName = $(subLayerName[0]);
                      }
                      var subLayerTitle = $(subLayers[i]).find('Title');
                      if (subLayerTitle && subLayerTitle.length) {
                        subLayerTitle = $(subLayerTitle[0]);
                      }
                      var sli = $('<li title="'+subLayerName.text()+'"/>').html('<i class="fa fa-file-o"></i>');
                      $(sli).appendTo(subLayersElement);
                      $('<span/>').html(subLayerTitle.text()).click([group, subLayerName, subLayerTitle], addToList).appendTo(sli);
                    }

                    li = $('<li title="'+name.text()+'"/>');
                    $('<i class="fa fa-folder-open-o"></i>').click(function() {
                      $(this).toggleClass('fa-folder-open-o fa-folder-o');
                    }).appendTo(li);
                    $('<span/>').html(title.text()).appendTo(li).click([group, name, title], addToList).appendTo(li);
                    subLayersElement.appendTo(li);
                  } else {
                    li = $('<li title="'+name.text()+'"/>').html('<i class="fa fa-file-o"></i>');
                    $('<span/>').html(title.text()).appendTo(li).click([group, name, title], addToList).appendTo(li);
                  }
                  li.appendTo(layerList);
                  
                  //todo: nested layer group
                  
                  
                }

                modal.find('.modal-body').empty();
                if (layerList.children().length > 0) {
                  modal.find('.modal-body').append(layerList);
                } else {
                  modal.find('.modal-body').html('No layers available');
                }
                $('body').append(modal);
                modal.modal("show");
                //modal.show();

              }
            });
          }).appendTo(header);
      }
      this.containers[group].appendChild(header);
    }
    element.appendChild(this.containers[group]);
  }
  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });
};

ol.inherits(app.LayersControl, ol.control.Control);

/**
 * Remove the control from its current map and attach it to the new map.
 * Here we create the markup for our layer switcher component.
 * @param {ol.Map} map Map.
 */
app.LayersControl.prototype.setMap = function(map) {
  ol.control.Control.prototype.setMap.call(this, map);
  var layers = map.getLayers().getArray();

  //Clear containers
  for (var container in this.containers) {
    var lists = $(this.containers[container]).find("li");
    $(lists).remove();
  }

  var title = "None";
  var group = "background";
  var item = document.createElement('li');
  $('<input />', {type: 'radio', name: group, value: title, checked:false}).
    change([map, group], function(evt) {
      var map = evt.data[0];
      var layers = map.getLayers().getArray();
      for (var i=0; i<layers.length; i++) {
        if (layers[i].get("group") == evt.data[1]) {
          layers[i].setVisible(false);
        }
      }
    }).appendTo(item);
  $('<span />').html(title).appendTo(item);
  this.containers[group].appendChild(item);

  for (var i=0; i < layers.length; i++) {
    var layer = layers[i];
    var name = layer.get('name');
    title = layer.get('title');
    group = layer.get('group') || this.defaultGroup;
    if (title) {
      var item = document.createElement('li');
      if (this.groups[group] && this.groups[group].exclusive === true) {
        $('<input />', {type: 'radio', name: group, value: title, checked:
          layer.getVisible()}).
          change([map, layer, group], function(evt) {
            var map = evt.data[0];
            var layers = map.getLayers().getArray();
            for (var j=0; j<layers.length; j++) {
              if (layers[j].get("group") == evt.data[2]) {
                layers[j].setVisible(false);
              }
            }
            var layer = evt.data[1];
            layer.setVisible($(this).is(':checked'));
          }).appendTo(item);
        $('<span />').html(title).appendTo(item);
        this.containers[group].appendChild(item);
      } else {
        $('<input />', {type: 'checkbox', checked: layer.getVisible()}).
          change(layer, function(evt) {
            evt.data.setVisible($(this).is(':checked'));
          }).appendTo(item);
        $('<span title="'+name+'"/>').html(title).appendTo(item);
        if (this.containers[group]) {
          this.containers[group].appendChild(item);
        } else if (this.containers[this.defaultGroup]) {
          this.containers[this.defaultGroup].appendChild(item);
        }
        //Delete button
        $('<a class="link link-rm"/>').html('-').click([layer], function(evt) {
          var layer = evt.data[0];
          var layers = map.getLayers().getArray();
          for (var j = 0; j < layers.length; j++) {
            if (layers[j] == layer) {
              layers.splice(j, 1);
              break;
            }
          }

          createMap(layers, controls, map.getOverlays(), registrationFunctions);

        }).appendTo(item);
      }
    }
  }
};
