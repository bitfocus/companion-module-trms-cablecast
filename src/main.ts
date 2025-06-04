/* eslint-disable n/no-unsupported-features/node-builtins */
import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'

export interface ControlRoom {
	id: string
	name: string
}

export interface Macro {
	id: string
	name: string
	controlRoom: number
}

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	controlRooms: ControlRoom[] = []
	macros: Macro[] = []
	config!: ModuleConfig // Setup in init()

	constructor(internal: unknown) {
		super(internal)
	}

	async getControlRooms(): Promise<ControlRoom[]> {
		try {
			const macrosResponse = await fetch(`${this.config.host}/cablecastapi/v1/controlrooms`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
				},
			})
			if (!macrosResponse.ok) {
				this.log('error', `Error fetching macros: ${macrosResponse.statusText}`)
				return []
			}
			const macrosData = await macrosResponse.json()
			return macrosData.controlRooms.map((ca: { id: string; name: string }) => {
				return ca
			})
		} catch (e) {
			console.error('Error fetching macros:', e)
			return []
		}
	}

	async getMacros(): Promise<Macro[]> {
		try {
			const macrosResponse = await fetch(`${this.config.host}/cablecastapi/v1/macros`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
				},
			})
			if (!macrosResponse.ok) {
				this.log('error', `Error fetching macros: ${macrosResponse.statusText}`)
				return []
			}
			const macrosData = await macrosResponse.json()
			return macrosData.macros.map((m: { id: string; name: string; controlRoom: number }) => {
				return m
			})
		} catch (e) {
			this.log('error', `Error fetching macros: ${e}`)
			return []
		}
	}

	async init(config: ModuleConfig): Promise<void> {
		this.controlRooms = []
		this.macros = []
		this.config = config

		this.updateStatus(InstanceStatus.Ok)

		const macros = await this.getMacros()
		const controlRooms = await this.getControlRooms()

		const macroActionChoices = macros
			.map((macro) => {
				this.log('info', `Macro - ${JSON.stringify(macro)}`)
				this.log('info', `Control Room - ${JSON.stringify(controlRooms)}`)
				const controlRoom = controlRooms.find((cr) => cr.id.toString() === macro.controlRoom.toString())
				return {
					id: macro.id,
					name: `${controlRoom?.name} - ${macro.name}`,
				} as Macro
			})
			.sort((a, b) => a.name.localeCompare(b.name))

		this.macros = macroActionChoices

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
