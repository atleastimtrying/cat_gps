reader = new FileReader
lmap = null
scene = null
track_part_to_json = (track_part)->
  t = $(track_part)
  lat: parseFloat t.attr('lat').trim()
  lon: parseFloat t.attr('lon').trim()
  elevation: parseFloat t.find('ele').text()
  time: t.find('time').text()

gpx_xml_to_json = (xml_string)->
  $(xml_string).find('trkpt').toArray().map track_part_to_json

store_file = (event)->
  process event.target.result

read_file = (file)->
  reader.readAsText file

read_gpx = (event)->
  read_file event.target.children.file.files[0]

validate_inputs = (event)->
  event.target.children.file.files.length > 0

upload = (event)->
  event.preventDefault();
  if validate_inputs event
    read_gpx event
  else
    alert 'invalid input'

process = (xml)->
  json = gpx_xml_to_json xml
  json_string = JSON.stringify json
  $('#process_section').show()
  assign_json_url json_string
  show_json json_string
  add_map json
  add_three json

add_map = (json)->
  lmap.setView([json[0].lat, json[0].lon])
  add_polygon json, lmap

add_polygon = (json, map)->
  arrays = json.map (element)-> [element.lat, element.lon]
  L.polygon(arrays).addTo lmap

add_three = (json)->
  start_lat = json[0].lat
  start_lon = json[0].lon
  start_elevation = json[0].elevation
  material = new THREE.MeshNormalMaterial()  
  geometry = new THREE.CubeGeometry(1,1,1)
  for point in json
    cube = new THREE.Mesh( geometry, material )
    cube.position.x = (point.lon - start_lon) * 500000;
    cube.position.y = point.elevation - start_elevation;
    cube.position.z = (point.lat - start_lat) * 500000;
    scene.add cube
  material = new THREE.LineBasicMaterial color: 0xffffff
  geometry = make_geometry json
  line = new THREE.Line(geometry, material)
  scene.add line

make_geometry = (json)->
  start_lat = json[0].lat
  start_lon = json[0].lon
  start_elevation = json[0].elevation
  geometry = new THREE.Geometry()
  for element in json
    geometry.vertices.push new THREE.Vector3 (element.lon - start_lon) * 500000, (element.elevation - start_elevation),(element.lat - start_lat) * 500000
  geometry.vertices.push new THREE.Vector3 0, 0, 0
  geometry

show_json = (json_string)->
  $('textarea#show_json').val(json_string)

assign_json_url = (json_string)->
  $('#json_download_link').attr 'href', "data:text/json;charset=utf-8," + encodeURIComponent json_string

$ ->
  lmap = L.map('map').setView([0,0], 18)
  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo lmap
  container = $ '#three'
  renderer = new THREE.WebGLRenderer()
  renderer.setSize 760, 400
  container[0].appendChild(renderer.domElement)
  camera = new THREE.PerspectiveCamera(45, 760 / 400, 1, 500)
  camera.position.set(0, 0, 100)
  scene = new THREE.Scene()
  controls = new THREE.OrbitControls camera, renderer.domElement
  controls.addEventListener 'change', ->
    renderer.render scene, camera
  renderer.render scene, camera
  $(reader).on 'load', store_file
  $('section').hide()
  $('#upload_section').show()
  $('#upload').on 'submit', upload