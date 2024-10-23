// Map.js
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const Map = ({
  pickupCoordinates,
  dropoffCoordinates,
  driverCoordinates,
  updatePrice,
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const pickupMarker = useRef(null);
  const dropoffMarker = useRef(null);
  const driverMarker = useRef(null);

  const carIconUrl = "/car.png";

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: pickupCoordinates,
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    }

    if (pickupCoordinates) {
      if (pickupMarker.current) {
        pickupMarker.current.setLngLat(pickupCoordinates);
      } else {
        pickupMarker.current = new mapboxgl.Marker({ color: "green" })
          .setLngLat(pickupCoordinates)
          .addTo(map.current);
      }
    }

    if (dropoffCoordinates) {
      if (dropoffMarker.current) {
        dropoffMarker.current.setLngLat(dropoffCoordinates);
      } else {
        dropoffMarker.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat(dropoffCoordinates)
          .addTo(map.current);
      }
    }

    if (driverCoordinates) {
      if (driverMarker.current) {
        driverMarker.current.setLngLat(driverCoordinates);
      } else {
        const carIcon = document.createElement("img");
        carIcon.src = carIconUrl;
        carIcon.style.width = "32px";
        carIcon.style.height = "32px";

        driverMarker.current = new mapboxgl.Marker({
          element: carIcon,
        })
          .setLngLat(driverCoordinates)
          .addTo(map.current);
      }
    } else if (driverMarker.current) {
      driverMarker.current.remove();
      driverMarker.current = null;
    }

    if (pickupCoordinates && dropoffCoordinates) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(pickupCoordinates);
      bounds.extend(dropoffCoordinates);
      if (driverCoordinates) {
        bounds.extend(driverCoordinates);
      }
      map.current.fitBounds(bounds, { padding: 200 });
    } else if (pickupCoordinates) {
      map.current.setCenter(pickupCoordinates);
      map.current.setZoom(12);
    }

    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    if (pickupCoordinates && dropoffCoordinates) {
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoordinates[0]},${pickupCoordinates[1]};${dropoffCoordinates[0]},${dropoffCoordinates[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      fetch(directionsUrl)
        .then((response) => response.json())
        .then((data) => {
          const route = data.routes[0].geometry;
          const distance = data.routes[0].distance;

          updatePrice(distance);

          map.current.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: route,
            },
          });

          map.current.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#3887be",
              "line-width": 5,
            },
          });
        })
        .catch((error) => console.error("Error fetching directions:", error));
    }
  }, [pickupCoordinates, dropoffCoordinates, driverCoordinates, updatePrice]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
