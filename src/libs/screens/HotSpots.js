// HotSpots.js
import React, { useState, useEffect } from 'react';

const HotSpots = () => {
  const [hotSpots, setHotSpots] = useState([]);

  useEffect(() => {
    // Simulate an API call to get hot spots data
    const fetchHotSpots = () => {
      // Mock data of hot spots
      const data = [
        { location: 'Downtown', demand: 80 },
        { location: 'Airport', demand: 120 },
        { location: 'Shopping Mall', demand: 60 },
      ];
      setHotSpots(data);
    };

    fetchHotSpots();
  }, []);

  return (
    <div>
      <h2>Hot Spot Locations</h2>
      <ul>
        {hotSpots.map((spot, index) => (
          <li key={index}>
            {spot.location}: {spot.demand} requests
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HotSpots;
