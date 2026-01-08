export const cinematicStyles = [
    {
        id: "spooky_cinema",
        label: "Spooky Cinema",
        tags: {
            lighting: [
                "(cinematic lighting:1.2)",
                "(low key lighting:1.3)",
                "dramatic shadows"
            ],
            color: [
                "(desaturated colors:1.2)",
                "muted color palette",
                "sickly green tones"
            ],
            texture: [
                "film grain",
                "analog noise",
                "soft focus"
            ],
            atmosphere: [
                "(eerie mood:1.3)",
                "dark atmosphere",
                "liminal space"
            ]
        },
        negatives: [
            "cartoon",
            "fantasy",
            "gore",
            "exaggerated distortion"
        ],
        intensity_profiles: {
            soft: {
                lighting: ["cinematic lighting"],
                color: ["muted color palette"]
            },
            medium: {
                lighting: ["(cinematic lighting:1.2)", "low key lighting"],
                color: ["(desaturated colors:1.2)"]
            },
            hard: {
                lighting: [
                    "(cinematic lighting:1.4)",
                    "(low key lighting:1.4)",
                    "dramatic shadows"
                ],
                color: ["(desaturated colors:1.3)"]
            }
        },
        image: "/assets/styles/spooky_cinema.png"
    }
];
