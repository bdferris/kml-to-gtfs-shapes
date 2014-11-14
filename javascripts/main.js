function KmlToGtfsShapes(outputElement) {
  this._outputElement = outputElement;
  this._file = null;
  this._generateReverseShapes = false;
}

KmlToGtfsShapes.prototype.setGenerateReverseShapes = function(enabled) {
  this._generateReverseShapes = enabled;
}

KmlToGtfsShapes.prototype.handleFileSelect = function(files) {
  if (files.length != 1) {
    console.log('Expected just one file.');
    return false;
  }
  this._file = files[0];
  return true;
}

KmlToGtfsShapes.prototype.convert = function() {
  if (!this._file) {
    console.log('no file specified');
    return;
  }

  this.writeHeader();

  var reader = new FileReader();
  var handleFileRead = this.handleFileRead.bind(this);
  reader.onload = function(e) {
    var text = reader.result;
    handleFileRead(text);
  }
  reader.readAsText(this._file);
};

KmlToGtfsShapes.prototype.handleFileRead = function(text) {
  var parser = new DOMParser();
  var xml = parser.parseFromString(text,"text/xml");
  var placemarks = xml.getElementsByTagName('Placemark');
  for (var i = 0; i < placemarks.length; ++i) {
    this.processPlacemark(placemarks[i]);
  }
};

KmlToGtfsShapes.prototype.processPlacemark = function(placemark) {
  var name = this.getElementByTagName(placemark, 'name');
  if (!name) {
    return;
  }
  var lineString = this.getElementByTagName(placemark, 'LineString');
  if (!lineString) {
    return;
  }
  var coordinates = this.getElementByTagName(lineString, 'coordinates');
  if (!coordinates) {
    return;
  }
  var shapeId = name.textContent;
  var points = this.parseCoordinates(coordinates.textContent);
  this.writePoints(shapeId, points);
  if (this._generateReverseShapes) {
    this.writePoints(shapeId + '-reverse', points.reverse());
  }
};

KmlToGtfsShapes.prototype.getElementByTagName = function(element, name) {
  for (var i = 0; i < element.childNodes.length; ++i) {
    if (element.childNodes[i].nodeName == name) {
      return element.childNodes[i];
    }
  }
  return null;
};

KmlToGtfsShapes.prototype.parseCoordinates = function(text) {
  var points = [];
  var tokens = text.split(" ");
  for (var i = 0; i < tokens.length; ++i) {
    var latlng = tokens[i].split(",");
    if (latlng.length < 2) {
      continue;
    }
    var point = {
      'lat': latlng[1],
      'lng': latlng[0]
    };
    points.push(point);
  }
  return points;
};

KmlToGtfsShapes.prototype.writeHeader = function() {
  this._outputElement.value =
    'shape_id,shape_pt_lat,shape_pt_lon,shape_pt_sequence\n';
};

KmlToGtfsShapes.prototype.writePoints = function(shapeId, points) {
  for (var i = 0; i < points.length; ++i) {
    var point = points[i];
    var line = shapeId + ',' + point.lat + ',' + point.lng + ',' + i + '\n';
    this._outputElement.value += line;
  }
}

function kml_to_gtfs_shapes_init() {
  var converter = new KmlToGtfsShapes(document.getElementById('output'));

  document.getElementById('file').addEventListener(
    'change', function(event) {
      var ready = converter.handleFileSelect(event.target.files);
      document.getElementById('convert-button').disabled = !ready;
    });

  document.getElementById('generate-reverse-shapes').addEventListener(
    'change', function(event) {
      converter.setGenerateReverseShapes(event.target.checked);
    });

  document.getElementById('convert-button').addEventListener(
    'click', function(event) {
      converter.convert();
    });

}
