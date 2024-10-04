let map;
    let autocomplete;
    let directionsService;
    let directionsRenderer;

    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 6.5244, lng: 3.3792 },
        zoom: 12,
      });

      const originInput = document.getElementById('origin-input');
      const destinationInput = document.getElementById('destination-input');

      autocomplete = new google.maps.places.Autocomplete(originInput);
      autocomplete.bindTo('bounds', map);

      const autocompleteDest = new google.maps.places.Autocomplete(destinationInput);
      autocompleteDest.bindTo('bounds', map);

      const trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);

      // const transitLayer = new google.maps.TransitLayer();
      // transitLayer.setMap(map);

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(map);
    }


    

    function searchLocation() {
      calculateRoute();
      const origin = document.getElementById('origin-input').value;
      const destination = document.getElementById('destination-input').value;

      if (destination) {
        calculateRoute(origin, destination);
      } else {
        searchSingleLocation(origin);
      }
    }

    function calculateRoute() {
      const origin = document.getElementById('origin-input').value;
      const destination = document.getElementById('destination-input').value;
      const modeSelect = document.getElementById('mode-select');
      const selectedMode = modeSelect.value;
    
      if (origin && !destination) {
        searchSingleLocation(origin);
        return;
      }
    
      if (!origin || !destination) {
        alert('Please enter both origin and destination.');
        return;
      }
    
      if (selectedMode === 'AIRPLANE') {
        calculateAirplaneRoute(origin, destination);
      } else {
        const request = {
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        };
    
        directionsService.route(request, (result, status) => {
          if (status === 'OK') {
            handleRouteResult(result, selectedMode);
          } else {
            alert('Directions request failed due to ' + status);
          }
        });
      }
    }
    
function calculateAirplaneRoute(origin, destination) {
  const geocoder = new google.maps.Geocoder();
  
  geocoder.geocode({ address: origin }, (originResults, originStatus) => {
    if (originStatus === 'OK') {
      geocoder.geocode({ address: destination }, (destResults, destStatus) => {
        if (destStatus === 'OK') {
          const originLatLng = originResults[0].geometry.location;
          const destLatLng = destResults[0].geometry.location;
          
          const distance = google.maps.geometry.spherical.computeDistanceBetween(originLatLng, destLatLng) / 1000; // in km
          const duration = distance / 800 * 3600; // assuming average speed of 800 km/h
          
          const path = [originLatLng, destLatLng];
          const flightPath = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
          });
          
          map.fitBounds(new google.maps.LatLngBounds(originLatLng, destLatLng));
          flightPath.setMap(map);
          
          displayRouteInfo('AIRPLANE', distance, duration, destLatLng);
        } else {
          alert('Geocode was not successful for the destination: ' + destStatus);
        }
      });
    } else {
      alert('Geocode was not successful for the origin: ' + originStatus);
    }
  });
}

function handleRouteResult(result, selectedMode) {
  directionsRenderer.setMap(null);
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    suppressInfoWindows: true,
    polylineOptions: {
      strokeColor: "#0000FF",
      strokeOpacity: 0.8,
      strokeWeight: 5
    }
  });
  directionsRenderer.setDirections(result);
  
  const route = result.routes[0];
  let distance = parseFloat(route.legs[0].distance.text);
  let duration = route.legs[0].duration.value; // duration in seconds

  // Apply multipliers based on selected mode
  switch(selectedMode) {
    case 'WALKING':
      duration *= 5;
      break;
    case 'BICYCLING':
      duration *= 2;
      break;
    case 'TRANSIT':
      duration *= 1.5;
      break;
  }

  displayRouteInfo(selectedMode, distance, duration, route.legs[0].end_location);
}

function displayRouteInfo(mode, distance, duration, position) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.round((duration % 3600) / 60);
  const durationText = `${hours > 0 ? hours + ' hr ' : ''}${minutes} min`;

  const infoWindow = new google.maps.InfoWindow({
    content: `Mode: ${mode}<br>Distance: ${distance.toFixed(2)} km<br>Time: ${durationText}`,
    position: position
  });
  
  infoWindow.open(map);

  const origin = document.getElementById('origin-input').value;
  const destination = document.getElementById('destination-input').value;
  generateLiveUpdate(origin, destination, `${distance.toFixed(2)} km`, durationText, mode);
}




document.getElementById('mode-select').addEventListener('change', calculateRoute);






function searchSingleLocation(location) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: location }, (results, status) => {
    if (status === 'OK') {
      map.setCenter(results[0].geometry.location);
      new google.maps.Marker({
        map: map,
        position: results[0].geometry.location,
      });
      generateLiveUpdate(location);
    } else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}



function generateLiveUpdate(origin, destination = null, distance = null, duration = null, mode = null) {
  const trafficConditions = ['free from traffic', 'experiencing moderate traffic', 'heavily congested'];
  const roadConditions = ['no roadblocks', 'minor roadwork', 'major road closure'];
  const safetyConditions = ['no reported accidents', 'minor accident reported', 'major accident, seek alternative route'];

  const randomTraffic = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];
  const randomRoad = roadConditions[Math.floor(Math.random() * roadConditions.length)];
  const randomSafety = safetyConditions[Math.floor(Math.random() * safetyConditions.length)];

  let updateContent = `The area around ${origin} is currently ${randomTraffic}.\nThere are ${randomRoad} in the vicinity.\nSafety update: ${randomSafety}.`;

  if (destination) {
    const modeText = {
      'DRIVING': 'driving',
      'WALKING': 'trekking',
      'BICYCLING': 'cycling',
      'TRANSIT': 'using public transit',
      'AIRPLANE': 'flying'
    };
    updateContent += `\nThe route from ${origin} to ${destination} ${modeText[mode]} is ${distance} long and will take approximately ${duration}.`;
  }

  document.getElementById('update-content').innerHTML = updateContent.replace(/\n/g, '<br>');
}






    function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.permissions.query({ name: 'geolocation' }).then(function(result) {
      if (result.state === 'granted') {
        useGeolocation();
      } else if (result.state === 'prompt') {
        alert("Please allow location access to use your current location.");
        useGeolocation();
      } else if (result.state === 'denied') {
        alert("Location access is denied. Please enable location services in your browser settings to use this feature.");
      }
    });
  } else {
    handleLocationError(false, map.getCenter());
  }
}

function useGeolocation() {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      map.setCenter(pos);
      new google.maps.Marker({
        position: pos,
        map: map,
        title: 'Your Location'
      });

      // Update the origin input with the current location
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: pos }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            document.getElementById('origin-input').value = results[0].formatted_address;
          }
        }
      });

      generateLiveUpdate('Your current location');
    },
    () => {
      handleLocationError(true, map.getCenter());
    }
  );
}
