// import backend from "../src/app"

// export default async () => {
// 	await backend.close()
// }

module.exports = async () => {
	const backend = global.__BACKEND__
	await backend.close()
}