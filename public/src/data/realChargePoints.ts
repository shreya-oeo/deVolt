// Real charging station data with proper Indian pricing and locations
export interface Connector {
  id: string;
  type: string;
  power_kw: number;
  status: 'available' | 'occupied' | 'maintenance' | 'offline';
}

export interface Location {
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Pricing {
  time_based: {
    rate: number;
    unit: string;
  };
  energy_based: {
    rate: number;
    unit: string;
  };
}

export interface ChargePoint {
  code: string;
  name: string;
  no_of_connectors: number;
  location: Location;
  status: 'active' | 'maintenance' | 'offline';
  pricing: Pricing;
  connectors: Connector[];
}

export const realChargePoints: ChargePoint[] = [
  {
    "code": "BERSTD34",
    "name": "3.3kW Charger",
    "no_of_connectors": 2,
    "location": {
      "city": "Bengaluru",
      "address": "12 MG Road, Bengaluru, KA",
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "status": "active",
    "pricing": {
      "time_based": {
        "rate": 2.0,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 19.0,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "Type-2 AC",
        "power_kw": 3.3,
        "status": "available"
      },
      {
        "id": "C2",
        "type": "Type-2 AC",
        "power_kw": 3.3,
        "status": "occupied"
      }
    ]
  },
  {
    "code": "DELHINR12",
    "name": "7.4kW Charger",
    "no_of_connectors": 1,
    "location": {
      "city": "New Delhi",
      "address": "Sector 18, Dwarka, New Delhi, DL",
      "latitude": 28.6139,
      "longitude": 77.2090
    },
    "status": "active",
    "pricing": {
      "time_based": {
        "rate": 2.5,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 20.0,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "CCS2 DC",
        "power_kw": 7.4,
        "status": "available"
      }
    ]
  },
  {
    "code": "MUMBAI45",
    "name": "11kW Charger",
    "no_of_connectors": 2,
    "location": {
      "city": "Mumbai",
      "address": "Andheri East, Mumbai, MH",
      "latitude": 19.0760,
      "longitude": 72.8777
    },
    "status": "maintenance",
    "pricing": {
      "time_based": {
        "rate": 1.5,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 17.0,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "Type-2 AC",
        "power_kw": 11,
        "status": "maintenance"
      },
      {
        "id": "C2",
        "type": "Type-2 AC",
        "power_kw": 11,
        "status": "maintenance"
      }
    ]
  },
  {
    "code": "CHENNAI88",
    "name": "22kW Dual Port Charger",
    "no_of_connectors": 2,
    "location": {
      "city": "Chennai",
      "address": "OMR Road, Chennai, TN",
      "latitude": 13.0827,
      "longitude": 80.2707
    },
    "status": "active",
    "pricing": {
      "time_based": {
        "rate": 3.0,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 21.5,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "CCS2 DC",
        "power_kw": 22,
        "status": "available"
      },
      {
        "id": "C2",
        "type": "CHAdeMO DC",
        "power_kw": 22,
        "status": "occupied"
      }
    ]
  },
  {
    "code": "HYDPLX09",
    "name": "DC Fast Charger 30kW",
    "no_of_connectors": 1,
    "location": {
      "city": "Hyderabad",
      "address": "Banjara Hills, Hyderabad, TS",
      "latitude": 17.3850,
      "longitude": 78.4867
    },
    "status": "offline",
    "pricing": {
      "time_based": {
        "rate": 3.5,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 22.0,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "CCS2 DC",
        "power_kw": 30,
        "status": "offline"
      }
    ]
  }
];

// Additional Bangalore stations to make the map more realistic
export const additionalBangaloreStations: ChargePoint[] = [
  {
    "code": "BGLWHIT23",
    "name": "Whitefield Tech Hub 50kW",
    "no_of_connectors": 3,
    "location": {
      "city": "Bengaluru",
      "address": "ITPL Main Rd, Whitefield, Bengaluru, KA",
      "latitude": 12.9698,
      "longitude": 77.7500
    },
    "status": "active",
    "pricing": {
      "time_based": {
        "rate": 4.0,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 23.0,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "CCS2 DC",
        "power_kw": 50,
        "status": "available"
      },
      {
        "id": "C2",
        "type": "CHAdeMO DC",
        "power_kw": 50,
        "status": "available"
      },
      {
        "id": "C3",
        "type": "Type-2 AC",
        "power_kw": 22,
        "status": "occupied"
      }
    ]
  },
  {
    "code": "BGLKOR89",
    "name": "Koramangala Fast Charge",
    "no_of_connectors": 2,
    "location": {
      "city": "Bengaluru",
      "address": "80 Feet Rd, 5th Block, Koramangala, Bengaluru, KA",
      "latitude": 12.9352,
      "longitude": 77.6245
    },
    "status": "active",
    "pricing": {
      "time_based": {
        "rate": 3.5,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 21.0,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "CCS2 DC",
        "power_kw": 25,
        "status": "available"
      },
      {
        "id": "C2",
        "type": "Type-2 AC",
        "power_kw": 22,
        "status": "available"
      }
    ]
  },
  {
    "code": "BGLBRIG67",
    "name": "Brigade Road Quick Charge",
    "no_of_connectors": 4,
    "location": {
      "city": "Bengaluru",
      "address": "Brigade Rd, Shanthala Nagar, Bengaluru, KA",
      "latitude": 12.9279,
      "longitude": 77.6271
    },
    "status": "active",
    "pricing": {
      "time_based": {
        "rate": 2.8,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 20.5,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "Type-2 AC",
        "power_kw": 7.4,
        "status": "available"
      },
      {
        "id": "C2",
        "type": "Type-2 AC",
        "power_kw": 7.4,
        "status": "occupied"
      },
      {
        "id": "C3",
        "type": "CCS2 DC",
        "power_kw": 15,
        "status": "available"
      },
      {
        "id": "C4",
        "type": "Type-2 AC",
        "power_kw": 7.4,
        "status": "available"
      }
    ]
  },
  {
    "code": "BGLIND56",
    "name": "Indiranagar Express Charge",
    "no_of_connectors": 2,
    "location": {
      "city": "Bengaluru",
      "address": "100 Feet Rd, Indiranagar, Bengaluru, KA",
      "latitude": 12.9719,
      "longitude": 77.6412
    },
    "status": "active",
    "pricing": {
      "time_based": {
        "rate": 3.2,
        "unit": "INR_per_min"
      },
      "energy_based": {
        "rate": 20.8,
        "unit": "INR_per_kWh"
      }
    },
    "connectors": [
      {
        "id": "C1",
        "type": "CCS2 DC",
        "power_kw": 30,
        "status": "available"
      },
      {
        "id": "C2",
        "type": "Type-2 AC",
        "power_kw": 11,
        "status": "available"
      }
    ]
  }
];

// Combined all stations
export const allChargePoints = [...realChargePoints, ...additionalBangaloreStations];

// Utility functions
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'text-green-400';
    case 'occupied':
      return 'text-yellow-400';
    case 'maintenance':
      return 'text-orange-400';
    case 'offline':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'available':
      return 'bg-green-500';
    case 'occupied':
      return 'bg-yellow-500';
    case 'maintenance':
      return 'bg-orange-500';
    case 'offline':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStationStatus = (connectors: Connector[]): string => {
  const availableConnectors = connectors.filter(c => c.status === 'available');
  if (availableConnectors.length === 0) {
    return 'occupied';
  }
  return 'available';
};

export const convertINRToUSD = (inrAmount: number): number => {
  // Approximate conversion rate (₹83 = $1)
  return inrAmount / 83;
};

export const formatCurrency = (amount: number, currency: 'INR' | 'USD' = 'INR'): string => {
  if (currency === 'INR') {
    return `₹${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
};

export default allChargePoints;