const geolib = require("geolib");

const baseFare = 50;
const perKmRate = 12;

const calculatePrice = (pickupLocation, dropoffLocation, vehicleType) => {
  const distance =
    geolib.getDistance(
      {
        latitude: pickupLocation.coordinates[1],
        longitude: pickupLocation.coordinates[0],
      },
      {
        latitude: dropoffLocation.coordinates[1],
        longitude: dropoffLocation.coordinates[0],
      }
    ) / 1000; // Convert to kilometers

  const cost = baseFare + distance * perKmRate;

  return cost.toFixed(2);
};

module.exports = calculatePrice;
