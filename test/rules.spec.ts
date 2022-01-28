import RuleModel from "../src/database/rule"
import backend from "../src/app"
import * as mockingoose from "mockingoose"
import { createRule, createRules } from "./utils"
import { Rule } from "fagc-api-types"
import { z } from "zod"

describe("GET /rules/", () => {
	it("Should fetch all rules and return them correctly", async () => {
		const fetchedData = createRules(10)
		mockingoose(RuleModel).toReturn(fetchedData, "find")
		const response = await backend.inject({
			path: "/rules",
			method: "GET"
		})
		expect(response.statusCode).toBe(200)
		const backendData = await response.json()
		expect(backendData.length).toBe(fetchedData.length)
		const backendRules = z.array(Rule).safeParse(fetchedData)
		expect(backendRules.success).toBe(true)

		if (backendRules.success) {
			const parsedRules = backendRules.data
			expect(parsedRules.length).toBe(fetchedData.length)
			parsedRules.map((rule, index) => {
				const dbRule = backendData[index]
				expect(rule).toEqual(dbRule)
			})
		}
	})
})

describe("GET /rules/:id", () => {
	it("Should fetch a rule by it's ID and return it correctly", async () => {
		const fetchedData = createRule()
		mockingoose(RuleModel).toReturn(fetchedData, "findOne")
		const response = await backend.inject({
			path: `/rules/${fetchedData.id}`,
			method: "GET"
		})
		expect(response.statusCode).toBe(200)
		const rawData = await response.json()
		const backendRule = Rule.safeParse(rawData)
		expect(backendRule.success).toBe(true)

		if (backendRule.success) {
			const parsedData = backendRule.data
			expect(parsedData).toEqual(fetchedData)
		}
	})
	it("Should return null if no rule is found", async () => {
		mockingoose(RuleModel).toReturn(null, "findOne")
		const response = await backend.inject({
			path: "/rules/1234",
			method: "GET"
		})
		expect(response.statusCode).toBe(200)
		const rawData = await response.json()
		expect(rawData).toBe(null)
	})
})

describe("POST /rules", () => {
	it("Should create a rule successfully with short and long descriptions provided", async () => {
		const fetchedData = createRule()
		mockingoose(RuleModel).toReturn(fetchedData, "create")
		const response = await backend.inject({
			path: "/rules",
			method: "POST"
		})
		expect(response.statusCode).toBe(200)
		const backendData = await response.json()
		expect(backendData).toBe(fetchedData)
	})
})