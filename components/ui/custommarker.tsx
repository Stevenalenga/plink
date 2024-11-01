// CustomMarker.tsx

import React from 'react';

export interface CustomMarkerProps {
  lat: number;
  lng: number;
  imageUrl: string;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ imageUrl }) => {
  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
        border: '2px solid white',
      }}
    >
      <img
        src={imageUrl}
        alt="Custom marker"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};

export default CustomMarker;
