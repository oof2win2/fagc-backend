const { WebhookClient, MessageEmbed } = require("discord.js")
const WebhookSchema = require("../database/fagc/webhook")
const config = require("../../config")
const WebSocket = require("ws")
const wss = new WebSocket.Server({ port: config.ports.websocket })
const GuildConfigModel = require("../database/bot/community")

let WebhookQueue = []

module.exports = {
	WebhookMessage,
	WebsocketMessage,
	reportCreatedMessage,
	reportRevokedMessage,
	ruleCreatedMessage,
	ruleRemovedMessage,
	offenseRevokedMessage,
	communityCreatedMessage,
	communityRemovedMessage,
	communityConfigChanged,
}
async function SendWebhookMessages() {
	let embeds = WebhookQueue.slice(0, 10)
	if (!embeds[0]) return
	WebhookQueue = WebhookQueue.slice(10)
	const webhooks = await WebhookSchema.find()
	webhooks.forEach(async (webhook) => {
		const client = new WebhookClient(webhook.id, webhook.token)
		client.send({embeds: embeds, username: "FAGC Notifier"}).catch((error) => {
			if (error.stack.includes("Unknown Webhook")) {
				console.log(`Unknown webhook ${webhook.id} with token ${webhook.token}. GID ${webhook.guildId}. Removing webhook from database.`)
				WebhookSchema.findByIdAndDelete(webhook.id)
			}
			else throw error
		})
	})
}
setInterval(SendWebhookMessages, 5000)

function WebhookMessage(message) {
	WebhookQueue.push(message)
}

wss.on("connection", (ws) => {
	ws.on("message", async (msg) => {
		const message = JSON.parse(msg.toString("utf-8"))
		if (message.guildId) {
			ws.guildId = message.guildId
			if (!message) return
			const guildConfig = await GuildConfigModel.findOne({guildId: message.guildId}).then((c) => c?.toObject())
			if (guildConfig) ws.send(Buffer.from(JSON.stringify({
				...guildConfig,
				messageType: "guildConfig"
			})))
		}
	})
})

async function WebsocketMessage(message) {
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message)
		}
	})
}
async function reportCreatedMessage(report) {
	if (report === null || report.playername === undefined) return
	report.messageType = "report"
	WebsocketMessage(JSON.stringify(report))
	let reportEmbed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Report Created")
		.setColor("ORANGE")
		.addFields(
			{ name: "Playername", value: report.playername },
			{ name: "Admin ID", value: report.adminId },
			{ name: "Community ID", value: report.communityId },
			{ name: "Broken Rule", value: report.brokenRule },
			{ name: "Automated", value: report.automated },
			{ name: "Proof", value: report.proof },
			{ name: "Description", value: report.description },
			{ name: "Report ID", value: report.id },
			{ name: "Report Time", value: report.reportedTime }
		)
		.setTimestamp()
	WebhookMessage(reportEmbed)
}
async function reportRevokedMessage(revocation) {
	if (revocation === null || revocation.playername === undefined) return
	revocation.messageType = "revocation"
	WebsocketMessage(JSON.stringify(revocation))
	let revocationEmbed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Report Revoked")
		.setColor("ORANGE")
		.addFields(
			{ name: "Playername", value: revocation.playername },
			{ name: "Admin ID", value: revocation.adminId },
			{ name: "Community ID", value: revocation.communityId },
			{ name: "Broken Rules", value: revocation.brokenRule },
			{ name: "Automated", value: revocation.automated },
			{ name: "Proof", value: revocation.proof },
			{ name: "Description", value: revocation.description },
			{ name: "Revocation ID", value: revocation.id },
			{ name: "Revocation Time", value: revocation.revokedTime },
			{ name: "Revoked by", value: revocation.revokedBy },
		)
		.setTimestamp()
	WebhookMessage(revocationEmbed)
}

async function ruleCreatedMessage(rule) {
	if (rule === null || rule.shortdesc === undefined || rule.longdesc === undefined) return
	rule.messageType = "ruleCreated"
	WebsocketMessage(JSON.stringify(rule))
	let ruleEmbed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Rule created")
		.setColor("ORANGE")
		.addFields(
			{ name: "Rule short description", value: rule.shortdesc },
			{ name: "Rule long description", value: rule.longdesc }
		)
	WebhookMessage(ruleEmbed)
}

async function ruleRemovedMessage(rule) {
	if (rule === null || rule.shortdesc === undefined || rule.longdesc === undefined) return
	rule.messageType = "ruleRemoved"
	WebsocketMessage(JSON.stringify(rule))
	let ruleEmbed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Rule removed")
		.setColor("ORANGE")
		.addFields(
			{name: "Rule short description", value: rule.shortdesc},
			{name: "Rule long description", value: rule.longdesc}
		)
	WebhookMessage(ruleEmbed)
}

async function offenseRevokedMessage(offense) {
	offense.messageType = "offenseRevoked"
	WebsocketMessage(JSON.stringify(offense))
	let embed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Offense revoked")
		.setColor("ORANGE")
	offense.forEach((revocation) => {
		embed.addField(
			`ID: ${revocation.id}`,
			`Playername: ${revocation.playername}, Admin ID: ${revocation.adminId}, Community ID: ${revocation.communityId}\n` +
			`Broken rule: ${revocation.brokenRule}, Automated: ${revocation.automated}, Proof: ${revocation.proof}\n` +
			`Description: ${revocation.description}, Revocation time: ${revocation.revokedTime}, Revoked by: ${revocation.revokedBy}\n`
		)
	})
	WebhookMessage(embed)
}

async function communityCreatedMessage(community) {
	community.messageType = "communityCreated"
	WebsocketMessage(JSON.stringify(community))
	let embed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Community created")
		.setColor("ORANGE")
		.addFields(
			{ name: "Community name", value: community.name },
			{ name: "Contact", value: community.contact }
		)
	WebhookMessage(embed)
}
async function communityRemovedMessage(community) {
	community.messageType = "communityRemoved"
	WebsocketMessage(JSON.stringify(community))
	let embed = new MessageEmbed()
		.setTitle("FAGC Notifications")
		.setDescription("Community removed")
		.setColor("ORANGE")
		.addFields(
			{ name: "Community name", value: community.name },
			{ name: "Contact", value: community.contact }
		)
	WebhookMessage(embed)
}
async function communityConfigChanged(config) {
	wss.clients.forEach(client => {
		if (client.guildId == config.guildId) {
			client.send(Buffer.from(JSON.stringify({
				...config,
				messageType: "guildConfig"
			})))
		}
	})
}

wss.on("connection", () => {
	console.log("new WebSocket connection!")
})
wss.on("listening", () => {
	console.log("Websocket listening!")
})