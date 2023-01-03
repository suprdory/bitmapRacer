export let p = {
    "car": {
        "x": 2,
        "y": 3,
    },
    "run": {
        "pixPerMetre": 12,
        "dt": 0.2,
        "nMax": 10000,
        "lookAhead": 0.333,
        "panSpeed": 0.2,
    },
    "phys": {
        "CD": 100,
        "Crr": 2,
        "CA": 0.5,
        "F_lat":30,
        "stiffness":250,
    },
    "track": {
        "metresPerPix": 0.25,
        "sfcTypes": {
            "outOfBounds": { "mu": 1.0, "drag": 0.2 },
            "tarmac": { "mu": 0.8, "drag": 0.001 },
            "grass": { "mu": 0.3, "drag": 0.02 },
            "mud": { "mu": 0.2, "drag": 0.3 },
            "unknown": { "mu": 0.8, "drag": 0.01 },
        }
    },
    "draw":{
        "baseLW":2,
        
    }
}
