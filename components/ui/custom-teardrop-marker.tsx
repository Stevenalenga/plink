'use client'

import React from 'react'
import { OverlayView } from '@react-google-maps/api'

export interface CustomMarkerProps {
  lat: number
  lng: number
  imageUrl: string
  onClick?: () => void
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ lat, lng, imageUrl, onClick }) => {
  return (
    <OverlayView
      position={{ lat, lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={(width, height) => ({
        x: -(width / 2),
        y: -height,
      })}
    >
      <div className="relative cursor-pointer" onClick={onClick}>
        <svg
          width="40"
          height="60"
          viewBox="0 0 40 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-md"
        >
          <defs>
            <clipPath id="teardropClip">
              <path d="M20 0C8.954 0 0 8.954 0 20C0 35 20 60 20 60C20 60 40 35 40 20C40 8.954 31.046 0 20 0Z" />
            </clipPath>
          </defs>
          <path
            d="M20 0C8.954 0 0 8.954 0 20C0 35 20 60 20 60C20 60 40 35 40 20C40 8.954 31.046 0 20 0Z"
            fill="#4A90E2"
          />
        </svg>
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{
            clipPath: 'url(#teardropClip)',
          }}
        >
          <img
            src={imageUrl}
            alt="Location thumbnail"
            className="w-full h-full object-cover"
            style={{
              clipPath: 'url(#teardropClip)',
            }}
          />
        </div>
      </div>
    </OverlayView>
  )
}

export default CustomMarker