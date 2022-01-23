// import backend from "../src/app"
// import * as jest from "jest"

// // globalSetup
// async function init() {
// 	console.log("Initialization")

// 	// Do all your initialization stuff 
// 	// I use a setTimeout to simulate true async
// 	await backend.listen(0)
// }

// // globalTeardown
// async function afterTests() {
// 	await backend.close()
// }
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("ts-node").register({ transpileOnly: true })
module.exports = require("./setup")