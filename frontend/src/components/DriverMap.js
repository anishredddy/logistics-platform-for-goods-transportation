import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const DriverMap = ({ pickupCoordinates, dropoffCoordinates }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const dropoffMarker = useRef(null);
  const previousDropoffCoordinates = useRef(null);

  const carIconUrl = "/car.png";

  useEffect(() => {
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: dropoffCoordinates || [0, 0],
        zoom: 15,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    }

    if (dropoffCoordinates) {
      if (dropoffMarker.current) {
        dropoffMarker.current.setLngLat(dropoffCoordinates);
      } else {
        const carIcon = document.createElement("img");
        carIcon.src = carIconUrl;
        carIcon.style.width = "32px";
        carIcon.style.height = "32px";

        dropoffMarker.current = new mapboxgl.Marker({
          element: carIcon,
        })
          .setLngLat(dropoffCoordinates)
          .addTo(map.current);
      }

      if (
        !previousDropoffCoordinates.current ||
        Math.abs(
          previousDropoffCoordinates.current[0] - dropoffCoordinates[0]
        ) > 0.001 ||
        Math.abs(
          previousDropoffCoordinates.current[1] - dropoffCoordinates[1]
        ) > 0.001
      ) {
        map.current.setCenter(dropoffCoordinates);
        map.current.setZoom(18);
        previousDropoffCoordinates.current = dropoffCoordinates;
      }
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
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0].geometry;

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
          } else {
            console.warn("No route found");
          }
        })
        .catch((error) => console.error("Error fetching directions:", error));
    }
  }, [pickupCoordinates, dropoffCoordinates]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default DriverMap;
