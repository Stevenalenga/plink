'use client'

import React from 'react'
import { OverlayView } from '@react-google-maps/api'

export interface CustomMarkerProps {
  lat: number
  lng: number
  imageUrl: string
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ lat, lng, imageUrl }) => {
  return (
    <OverlayView
      position={{ lat, lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -height,
      })}
    >
      <div className="relative">
        <svg
          width="40"
          height="60"
          viewBox="0 0 40 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          <path
            d="M20 0C8.954 0 0 8.954 0 20C0 35 20 60 20 60C20 60 40 35 40 20C40 8.954 31.046 0 20 0Z"
            fill="#4A90E2"
          />
          <circle cx="20" cy="20" r="18" fill="white" />
        </svg>
        <div
          className="absolute top-1 left-1 w-[38px] h-[38px] rounded-full overflow-hidden"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          role="img"
          aria-label="Location marker"
        />
      </div>
    </OverlayView>
  )
}

export default CustomMarker