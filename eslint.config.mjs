import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypeScript,
	{
		rules: {
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "inline-type-imports",
				},
			],
		},
	},
	{
		ignores: [
			"node_modules/**",
			".next/**",
			".husky/**",
			"out/**",
			"build/**",
			"dist/**",
			"coverage/**",
		],
	},
];

export default eslintConfig;
