import backend from "../src/app"

export default async function () {
	await backend.listen(0)
	global.__BACKEND__ = backend
}