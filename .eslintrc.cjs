module.exports = {
    extends: ["@lusito/eslint-config-react"],
    rules: {},
    env: {
        browser: true,
    },
    overrides: [
        {
            files: ["./tests/*.ts"],
            rules: {
                "react-hooks/rules-of-hooks": "off",
                "import/no-extraneous-dependencies": "off",
                "@typescript-eslint/ban-ts-comment": "off",
            },
        },
    ],
};
