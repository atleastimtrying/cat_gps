(function() {
  var add_map, add_polygon, add_three, assign_json_url, gpx_xml_to_json, lmap, make_geometry, process, read_file, read_gpx, reader, scene, show_json, store_file, track_part_to_json, upload, validate_inputs;

  reader = new FileReader;

  lmap = null;

  scene = null;

  track_part_to_json = function(track_part) {
    var t;
    t = $(track_part);
    return {
      lat: parseFloat(t.attr('lat').trim()),
      lon: parseFloat(t.attr('lon').trim()),
      elevation: parseFloat(t.find('ele').text()),
      time: t.find('time').text(),
      timestamp: Date.parse(t.find('time').text())
    };
  };

  gpx_xml_to_json = function(xml_string) {
    return $(xml_string).find('trkpt').toArray().map(track_part_to_json);
  };

  store_file = function(event) {
    return process(event.target.result);
  };

  read_file = function(file) {
    return reader.readAsText(file);
  };

  read_gpx = function(event) {
    return read_file(event.target.children.file.files[0]);
  };

  validate_inputs = function(event) {
    return event.target.children.file.files.length > 0;
  };

  upload = function(event) {
    event.preventDefault();
    if (validate_inputs(event)) {
      return read_gpx(event);
    } else {
      return alert('invalid input');
    }
  };

  process = function(xml) {
    var json, json_string;
    json = gpx_xml_to_json(xml);
    json_string = JSON.stringify(json);
    $('#process_section').show();
    assign_json_url(json_string);
    show_json(json_string);
    add_map(json);
    return add_three(json);
  };

  add_map = function(json) {
    lmap.setView([json[0].lat, json[0].lon]);
    return add_polygon(json, lmap);
  };

  add_polygon = function(json, map) {
    var arrays;
    arrays = json.map(function(element) {
      return [element.lat, element.lon];
    });
    return L.polygon(arrays).addTo(lmap);
  };

  add_three = function(json) {
    var colour_float, cube, geometry, light, material, point, start_elevation, start_lat, start_lon, start_timestamp, timestamp_range, _i, _len, _results;
    start_lat = json[0].lat;
    start_lon = json[0].lon;
    start_elevation = json[0].elevation;
    start_timestamp = json[0].timestamp;
    timestamp_range = json[json.length - 1].timestamp - start_timestamp;
    geometry = new THREE.SphereGeometry(2, 6, 6);
    _results = [];
    for (_i = 0, _len = json.length; _i < _len; _i++) {
      point = json[_i];
      colour_float = (point.timestamp - start_timestamp) / timestamp_range;
      material = new THREE.MeshLambertMaterial({
        color: colour_float * 0xffffff
      });
      cube = new THREE.Mesh(geometry, material);
      light = new THREE.PointLight(0xffeeee, 1, 10);
      cube.position.x = (point.lon - start_lon) * 5000;
      cube.position.y = (point.elevation - start_elevation) / 10;
      cube.position.z = (point.lat - start_lat) * 5000;
      light.position.set(cube.position.x + 4, cube.position.y, cube.position.z);
      scene.add(cube);
      _results.push(scene.add(light));
    }
    return _results;
  };

  make_geometry = function(json) {
    var element, geometry, start_elevation, start_lat, start_lon, _i, _len;
    start_lat = json[0].lat;
    start_lon = json[0].lon;
    start_elevation = json[0].elevation;
    geometry = new THREE.Geometry();
    for (_i = 0, _len = json.length; _i < _len; _i++) {
      element = json[_i];
      geometry.vertices.push(new THREE.Vector3((element.lon - start_lon) * 5000, (element.elevation - start_elevation) / 100, (element.lat - start_lat) * 5000));
    }
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));
    return geometry;
  };

  show_json = function(json_string) {
    return $('textarea#show_json').val(json_string);
  };

  assign_json_url = function(json_string) {
    return $('#json_download_link').attr('href', "data:text/jsoncharset=utf-8," + encodeURIComponent(json_string));
  };

  $(function() {
    var camera, container, controls, renderer;
    lmap = L.map('map').setView([0, 0], 18);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(lmap);
    container = $('#three');
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(760, 400);
    container[0].appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera(45, 760 / 400, 1, 500);
    camera.position.set(0, 0, 100);
    scene = new THREE.Scene();
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', function() {
      return renderer.render(scene, camera);
    });
    renderer.render(scene, camera);
    $(reader).on('load', store_file);
    $('section').hide();
    $('#upload_section').show();
    return $('#upload').on('submit', upload);
  });

}).call(this);
