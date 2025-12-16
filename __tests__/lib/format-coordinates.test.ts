import { formatCoordinate, formatLocation } from '@/lib/format-coordinates'

describe('formatCoordinate', () => {
  it('formats positive latitude correctly', () => {
    expect(formatCoordinate(40.7128, true)).toBe("40° 42' 46\" N")
  })

  it('formats negative latitude correctly', () => {
    expect(formatCoordinate(-33.8688, true)).toBe("33° 52' 7\" S")
  })

  it('formats positive longitude correctly', () => {
    expect(formatCoordinate(74.0060, false)).toBe("74° 0' 21\" E")
  })

  it('formats negative longitude correctly', () => {
    expect(formatCoordinate(-74.0060, false)).toBe("74° 0' 21\" W")
  })

  it('handles zero coordinates', () => {
    expect(formatCoordinate(0, true)).toBe("0° 0' 0\" N")
    expect(formatCoordinate(0, false)).toBe("0° 0' 0\" E")
  })
})

describe('formatLocation', () => {
  it('formats location with positive coordinates', () => {
    expect(formatLocation(40.7128, -74.0060)).toBe("40° 42' 46\" N, 74° 0' 21\" W")
  })

  it('formats location with mixed coordinates', () => {
    expect(formatLocation(-33.8688, 151.2093)).toBe("33° 52' 7\" S, 151° 12' 33\" E")
  })
})