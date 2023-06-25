export let tracksOG = [
    {
        "fnames": ['tracks/square_track_extramud.png', 'tracks/square_track_ice.png'],
        "bgColour": "#4f3019",
        "drawScale": 0.6,
        "trackScale": 0.7,

        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 0.0,
        "startX": 180,
        "startY": 260,

        "startThetaRev": Math.PI,
        "startXRev": 180,
        "startYRev": 720,

        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 250, 'y': 500 }, 'right': { 'x': 70, 'y': 500 } },
            { 'n': 1, 'left': { 'x': 700, 'y': 500 }, 'right': { 'x': 1000, 'y': 500 } },
            { 'n': 2, 'left': { 'x': 450, 'y': 770 }, 'right': { 'x': 450, 'y': 580 } },
            { 'n': 3, 'left': { 'x': 330, 'y': 250 }, 'right': { 'x': 330, 'y': 0 } },
        ]
    },
    {
        "fnames": ['tracks/square_track2_allpath.png'],
        "bgColour": "#381b00",
        "drawScale": 0.6,
        "trackScale": 0.6,
        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 3.3,
        "startX": 140,
        "startY": 840,

        "startThetaRev": -0.4,
        "startXRev": 180,
        "startYRev": 200,

        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 16, 'y': 500 }, 'right': { 'x': 187, 'y': 500 } },
            { 'n': 1, 'left': { 'x': 580, 'y': 150 }, 'right': { 'x': 438, 'y': 250 } },
            { 'n': 2, 'left': { 'x': 805, 'y': 252 }, 'right': { 'x': 975, 'y': 237 } },
            { 'n': 3, 'left': { 'x': 365, 'y': 531 }, 'right': { 'x': 195, 'y': 529 } },
            { 'n': 4, 'left': { 'x': 940, 'y': 783 }, 'right': { 'x': 767, 'y': 794 } },
        ]
    },

    {
        "fnames": ['tracks/square_track3_mark.png'],
        "bgColour": "#462402",
        "drawScale": 0.8,
        "trackScale": 0.8,
        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 1.4,
        "startX": 240,
        "startY": 60,

        "startThetaRev": -1.7,
        "startXRev": 800,
        "startYRev": 136,

        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 433, 'y': 33 }, 'right': { 'x': 423, 'y': 130 } },
            { 'n': 1, 'left': { 'x': 546, 'y': 504 }, 'right': { 'x': 594, 'y': 417 } },
            { 'n': 2, 'left': { 'x': 367, 'y': 553 }, 'right': { 'x': 265, 'y': 567 } },
            { 'n': 3, 'left': { 'x': 669, 'y': 970 }, 'right': { 'x': 651, 'y': 868 } },
            { 'n': 4, 'left': { 'x': 112, 'y': 267 }, 'right': { 'x': 171, 'y': 181 } },
        ]
    },

    {
        "fnames": ['tracks/BC1-Regular.png', 'tracks/BC1-GrassTrack.png', 'tracks/BC1-Overgrown.png',],
        "bgColour": "#B97A56",
        "drawScale": 0.6,
        "trackScale": 0.5,
        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 3.141,
        "startX": 180,
        "startY": 840,

        "startThetaRev": 0,
        "startXRev": 180,
        "startYRev": 200,

        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 0, 'y': 500 }, 'right': { 'x': 199, 'y': 500 } },
            { 'n': 1, 'left': { 'x': 500, 'y': 0 }, 'right': { 'x': 500, 'y': 185 } },
            { 'n': 2, 'left': { 'x': 1000, 'y': 195 }, 'right': { 'x': 790, 'y': 195 } },
            { 'n': 3, 'left': { 'x': 784, 'y': 357 }, 'right': { 'x': 555, 'y': 357 } },
            { 'n': 4, 'left': { 'x': 1000, 'y': 489 }, 'right': { 'x': 805, 'y': 489 } },
            { 'n': 5, 'left': { 'x': 945, 'y': 630 }, 'right': { 'x': 612, 'y': 630 } },
            { 'n': 6, 'left': { 'x': 800, 'y': 1000 }, 'right': { 'x': 800, 'y': 794 } },
            { 'n': 7, 'left': { 'x': 398, 'y': 369 }, 'right': { 'x': 398, 'y': 189 } },
            { 'n': 8, 'left': { 'x': 258, 'y': 1000 }, 'right': { 'x': 258, 'y': 793 } },
        ]
    },
    {
        "fnames": ['tracks/spiralator-0.png', 'tracks/spiralator-1.png'],
        "bgColour": "#4c0f00",
        "drawScale": 0.6,
        "trackScale": 1.2,
        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 4.9,
        "startX": 470,
        "startY": 720,

        "startThetaRev": 1,
        "startXRev": 88,
        "startYRev": 658,

        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 246, 'y': 784 }, 'right': { 'x': 275, 'y': 662 } },
            { 'n': 1, 'left': { 'x': 0, 'y': 660 }, 'right': { 'x': 163, 'y': 627 } },
            { 'n': 2, 'left': { 'x': 211, 'y': 449 }, 'right': { 'x': 356, 'y': 541 } },
            { 'n': 3, 'left': { 'x': 337, 'y': 0 }, 'right': { 'x': 371, 'y': 163 } },
            { 'n': 4, 'left': { 'x': 550, 'y': 210 }, 'right': { 'x': 459, 'y': 355 } },
            { 'n': 5, 'left': { 'x': 1000, 'y': 335 }, 'right': { 'x': 836, 'y': 371 } },
            { 'n': 6, 'left': { 'x': 789, 'y': 550 }, 'right': { 'x': 644, 'y': 459 } },
            { 'n': 7, 'left': { 'x': 662, 'y': 1000 }, 'right': { 'x': 628, 'y': 836 } },
            { 'n': 8, 'left': { 'x': 449, 'y': 789 }, 'right': { 'x': 541, 'y': 644 } },
        ]
    },
    {
        "fnames": ['tracks/track_Wlv.png'],
        "bgColour": "#4f3019",
        "drawScale": 0.6,
        "trackScale": 1.3,

        "x": 1000, // size, helpful for setting params before img loaded
        "y": 1000,

        "startTheta": 1.4,
        "startX": 247,
        "startY": 97,

        "startThetaRev": 4.5,
        "startXRev": 661,
        "startYRev": 171,

        "gates": [ // in track pixels
            { 'n': 0, 'left': { 'x': 504, 'y': 82 }, 'right': { 'x': 472, 'y': 210 } },
            { 'n': 1, 'left': { 'x': 802, 'y': 312 }, 'right': { 'x': 786, 'y': 208 } },
            { 'n': 2, 'left': { 'x': 483, 'y': 976 }, 'right': { 'x': 475, 'y': 765 } },
            { 'n': 3, 'left': { 'x': 175, 'y': 153 }, 'right': { 'x': 310, 'y': 181 } },
        ]
    },

]