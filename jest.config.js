module.exports = {
	preset: 'ts-jest/presets/js-with-babel',
	testEnvironment: 'node',
	roots: ['./src'],
	globals: {
		'ts-jest': {
			babelConfig: true,
		},
	},
}
