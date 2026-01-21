import globals from "globals";
import js from "@eslint/js";

export default [
    {
        ignores: ["scripts/**", "node_modules/**"]
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.node,
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": [
                "warn",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_"
                }
            ],
            "no-constant-condition": "warn",
            "no-debugger": "error",
            "no-console": "off",
            "prefer-const": "error",
            "no-var": "error"
        }
    }
];
