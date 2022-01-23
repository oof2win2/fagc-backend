/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
	preset: "ts-jest",
	globalSetup: "<rootDir>/test/prepareTest.js",
	globalTeardown: "<rootDir>/test/cleanupTest.js", }
