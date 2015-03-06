Map = (function () {
    var _appId = "7rWg1K2EDx7Xbqvot0rN";
    var _appCode = "zkV5AB57e7U14tY6Y3nLcQ";
    var _iconCluster = "../InmofactoryMVC4/Content/POIs/Cluster.png";
    var _listOfPois = null;
    var _clusterOfMarkers = null;
    var _marker = null;
    var _xyTypeEdited = 3;
    var _latLngToGo;
    var _popup;
    var _openPropertyInfoBubble = false;
    var _geojson;

    var _layerTypes = {
        NORMAL: "normal.day",
        SATELLITE: "satellite.day",
        PEDESTRIAN: "pedestrian.day",
        TERRAIN: "terrain.day"
    };

    var _defaultConfig = {
        divId: "map-container",
        zoom: 14,
        zoomable: true,
        latitude: 40.3964,
        longitude: -3.7129,
        pinable: false,
        drawable: false,
        hasPois: false,
        layerType: _layerTypes.NORMAL
    };

    var PoisAreEquals = function (firstPoi, secondPoi) {
        var equals = true;

        if (firstPoi.lat != secondPoi.lat) {
            equals = false;
        }

        if (firstPoi.lng != secondPoi.lng) {
            equals = false;
        }

        return equals;
    };


    var AddDraggableEvent = function (map, marker, options) {
        marker.on('dragend', function (event) {
            var newPosition = event.target.getLatLng();
            var latitude = newPosition.lat.toString().replace('.', ',');
            var longitude = newPosition.lng.toString().replace('.', ',');

            var panOptions = {
                animate: true,
                duration: 0.70,
                easeLinearity: 0.60
            };

            map.panTo(newPosition, panOptions);

            $("#" + options.fieldIdTypeXY).val(_xyTypeEdited);
            $("#" + options.fieldIdLatitude).val(latitude);
            $("#" + options.fieldIdLongitude).val(longitude);
        });
    };


    var ResetMapContent = function (map) {
        if (_clusterOfMarkers != null) {
            map.removeLayer(_clusterOfMarkers);
        }
    };


    var InitializeListOfPois = function (pois) {
        var size = pois.length;

        _listOfPois = [];

        for (var i = 0; i < size; i++) {
            var marker = L.marker(L.latLng(pois[i].Lat, pois[i].Lng));
            marker.id = pois[i].ID;
            marker.on('click', function (e) {
                $(".building-list .highlight").removeClass('highlight');
                $('[id$=' + e.target.id + ']').addClass('highlight');
                $("#chk_" + e.target.id).prop("checked");
            });

            _listOfPois.push(marker);
        }
    };


    var SetCenterFromClusterSelected = function (map) {
        if (_latLngToGo != undefined) {
            var panOptions = {
                animate: true,
                duration: 0.30,
                easeLinearity: 0.60
            };

            map.panTo(_latLngToGo, panOptions);
        }
    }

/*
    var CreateMarkerClusterGroup = function (map, markerIdToSelect) {
        var centerMap = false;

        _clusterOfMarkers = new L.MarkerClusterGroup({
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: false,
            singleMarkerMode: true,
            showCoverageOnHover: false,
            iconCreateFunction: function (cluster) {
                var count = cluster.getChildCount();
                
                var digits = (count + '').length;

                if (markerIdToSelect != undefined) {
                    var children = cluster.getAllChildMarkers();

                    for (var i = 0; i < children.length; i++) {
                        if (children[i].id == markerIdToSelect) {
                            _latLngToGo = children[i].getLatLng();

                            return new L.DivIcon({
                                className: 'cluster digits-' + digits + ' has' + count + 'ItemsYellow clusterItem',
                                iconSize: new L.Point(40, 50),
                            });
                        }
                    }
                }
                return new L.DivIcon({
                    className: 'cluster digits-' + digits + ' has' + count + 'Items clusterItem',
                    iconSize: new L.Point(40, 50),
                });
            }
        });

        _clusterOfMarkers.addLayers(_listOfPois);
        AddClickEventToClusterMarker();
    };*/

    var CreateMarkerClusterGroup = function (map, pois) {
        var centerMap = false;

        _clusterOfMarkers = new L.MarkerClusterGroup({
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: false,
            singleMarkerMode: true,
            showCoverageOnHover: false,
        });

        _clusterOfMarkers.addLayers(pois);
    };


    var AddClickEventToClusterMarker = function () {
        _clusterOfMarkers.on('clusterclick', function (a) {
            var children = a.layer.getAllChildMarkers();
            $(".building-list .highlight").removeClass('highlight');

            var propertiesIds = "";
            var anyMarkerInClusterId;
            for (var currentChild = 0; currentChild < children.length; currentChild++) {
                var propertyId = children[currentChild].id;
                anyMarkerInClusterId = propertyId;
                $('[id$=' + propertyId + ']').addClass('highlight');

                if (propertiesIds == "") {
                    propertiesIds = propertyId;
                    }
                else {
                    propertiesIds = propertiesIds + "," + propertyId;
                }
            }

            if (_openPropertyInfoBubble) {
                OpenPropertyInfoBubble(a, propertiesIds);
            }

            Maps.SelectClusterFromPropertySelected(a.target._map, anyMarkerInClusterId);
        });

        _clusterOfMarkers.on('click', function (a) {
            $(".building-list .highlight").removeClass('highlight');

            var markerIdInCluster = a.layer.id;
            $('[id$=' + markerIdInCluster + ']').addClass('highlight');

            if (_openPropertyInfoBubble) {
                OpenPropertyInfoBubble(a, markerIdInCluster);
            }

            Maps.SelectClusterFromPropertySelected(a.target._map, markerIdInCluster);
        });
    };


    var OpenPropertyInfoBubble = function (a, propertiesIds) {
        var map = a.target._map;
        var params = new Object();

        params.id = propertiesIds
        params.isMatching = $('#IsMatching').val() != undefined && $('#IsMatching').val() == "True";
        params.Fk_DemandId = $("#Fk_DemandId").val();
        var popupContent = '';
        $.post('/Property/ListMapInfo/', $.param(params), function (data) {
            popupContent = '<div style="width:345px; margin-right:20px; height: 240px; overflow: auto;">' + data + '</div>';

            if (_popup == undefined) {
                _popup = L.popup();
            }
            
            _popup.setLatLng(a.latlng);
            _popup.setContent(popupContent);
            _popup.openOn(map);
            
        });
    };


    var AddMarkerClusterGroupToMap = function (map) {
        map.addLayer(_clusterOfMarkers);
    };

    
    return {

        SetOpenPropertyInfoBubbleTo: function(openPropertyInfoBubble) {
            _openPropertyInfoBubble = openPropertyInfoBubble;
        },


        FitBoundsToClusterOfMarkers: function(map) {
            map.fitBounds(_clusterOfMarkers.getBounds());
        },


        GetListOfPois: function(){
            return _listOfPois;
        },


        GetLayerTypes: function () {
            return _layerTypes;
        },


        GetMarker: function(){
            return _marker;
        },


        GetClusterOfMarkers: function(){
            return _clusterOfMarkers;
        },


        CreateMap: function (config) {
            console.log('creamos mapa');
            config = config || _defaultConfig;
            divId = config.divId || _defaultConfig.divId;
            latitude = config.latitude || _defaultConfig.latitude;
            longitude = config.longitude || _defaultConfig.longitude;
            zoom = config.zoom || _defaultConfig.zoom;
            layerType = config.layerType || _defaultConfig.layerType;

            var HERE_normalDay = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/normal.day/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
                attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
                subdomains: '1234',
                mapID: 'newest',
                app_id: _appId,
                app_code: _appCode,
                base: 'base',
                minZoom: 0,
                maxZoom: 20
            });

            var HERE_satelliteDay = L.tileLayer('http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/satellite.day/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
                attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
                subdomains: '1234',
                mapID: 'newest',
                app_id: _appId,
                app_code: _appCode,
                base: 'aerial',
                minZoom: 0,
                maxZoom: 20
            });

            var map = L.map(config.divId, {
                center: [config.latitude, config.longitude],
                zoom: config.zoom,
                layers: [HERE_normalDay,HERE_satelliteDay]
            });

            var baseLayers = {
                "Normal": HERE_normalDay,
                "Satelite": HERE_satelliteDay
            };

            L.control.layers(baseLayers).addTo(map);
            return map;
        },


        AddMarkerToMap: function (map, coords, options) {
            _marker = L.marker([coords.latitude, coords.longitude], options);
            if (options.draggable == true) {
                AddDraggableEvent(map, _marker, options);
            }
            _marker.addTo(map);
            return _marker;
        },


        AddPoisToMap: function (map, pois) {
            ResetMapContent(map);

            //InitializeListOfPois(pois);

            CreateMarkerClusterGroup(pois);

            AddMarkerClusterGroupToMap(map);
        },


        AddRadiusToMap: function (map, options) {
            if (map != null) {
                var radius = L.circle([options.latitude, options.longitude], options.radius);
                radius.addTo(map);
                return radius;
            }
        },


        SelectClusterFromPropertySelected: function (map, id) {
            ResetMapContent(map);
            CreateMarkerClusterGroup(map, id);
            AddMarkerClusterGroupToMap(map);
            SetCenterFromClusterSelected(map);
        },


        getColor: function(d) {
           return d > 2000 ? '#800026' : d > 1750 ? '#BD0026' : d > 1500 ? '#E31A1C' : d > 1250 ? '#FC4E2A' : d > 1000 ? '#FD8D3C' : d > 750 ? '#FEB24C' : d > 500 ? '#FED976' : '#FFEDA0'; 
        },


        style: function (feature) { 
            return { fillColor: Map.getColor(feature.properties.count), weight: 2, opacity: 1, color: 'white', dashArray: '1', fillOpacity: 0.7 }; 
        },

        highlightFeature: function(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }
        },

        
        GetGeoJSon: function () {
            return _geojson;
        },

        SetGeoJSon: function (value) {
           _geojson = value;
        },

        resetHighlight: function (e) {
            _geojson.resetStyle(e.target);
        },

        zoomToFeature: function (e) {
            map.fitBounds(e.target.getBounds());
        },

        onEachFeature: function(feature, layer) {
            layer.on({
                mouseover: Map.highlightFeature,
                mouseout: Map.resetHighlight,
                click: Map.zoomToFeature
            });
>>>>>>> 57b8c6b506564be56018f0e5676ae75c53571ce9
        }

    }
})();
