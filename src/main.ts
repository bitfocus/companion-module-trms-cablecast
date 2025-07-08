import { InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariables } from './variables.js'
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

export interface Device {
	id: string
	name: string
}

export interface Event {
	scheduleId: number
	runDateTime?: string
	endDateTime?: string
	channelId: number
	channelName?: string
	showTitle?: string
}

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	controlRooms: ControlRoom[] = []
	macros: Macro[] = []
	devices: Device[] = []
	upcomingEvents: Event[] = []
	timeout: NodeJS.Timeout | null = null // For polling
	config!: ModuleConfig // Setup in init()

	constructor(internal: unknown) {
		super(internal)
	}

	async getControlRooms(): Promise<ControlRoom[]> {
		try {
			const controlRoomsResponse = await fetch(`${this.config.host}/cablecastapi/v1/controlrooms`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
				},
			})
			if (!controlRoomsResponse.ok) {
				this.log('error', `Error1 fetching controlrooms: ${controlRoomsResponse.statusText}`)
				return []
			}
			const controlRoomsData = (await controlRoomsResponse.json()) as { controlRooms: ControlRoom[] }
			return controlRoomsData.controlRooms
		} catch (e) {
			this.log('error', `Fetching controlrooms failed. Error: ${e}`)
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
			const macrosData = (await macrosResponse.json()) as { macros: Macro[] }
			return macrosData.macros
		} catch (e) {
			this.log('error', `Fetching macros Failed: ${e}`)
			return []
		}
	}

	async getDevices(): Promise<Device[]> {
		try {
			const devicesResponse = await fetch(`${this.config.host}/cablecastapi/v1/devices`, {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
				},
			})
			if (!devicesResponse.ok) {
				this.log('error', `Error fetching devices: ${devicesResponse.statusText}`)
				return []
			}
			const devicesData = (await devicesResponse.json()) as { devices: Device[] }
			return devicesData.devices
		} catch (e) {
			this.log('error', `Fetching devices Failed: ${e}`)
			return []
		}
	}

	async getUpcomingEvents(): Promise<Event[]> {
		try {
			const eventsResponse = await fetch(
				`${this.config.host}/cablecastapi/v1/controlrooms/upcomingevents?location=${this.config.locationId}`,
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
					},
				},
			)
			if (!eventsResponse.ok) {
				this.log('error', `Error fetching upcoming events: ${eventsResponse.statusText}`)
				return []
			}
			const eventsData = (await eventsResponse.json()) as { events: Event[] }
			return eventsData.events
		} catch (e) {
			this.log('error', `Fetching upcoming events Failed: ${e}`)
			return []
		}
	}

	async init(config: ModuleConfig): Promise<void> {
		this.controlRooms = []
		this.macros = []
		this.devices = []
		this.config = config

		await this.reload()
	}

	async reload(): Promise<void> {
		this.timeout?.close()

		if (!this.config.host || !this.config.username || !this.config.password) {
			this.log('warn', 'Module not configured')
			this.updateStatus(InstanceStatus.Disconnected)
			return
		}

		try {
			const macros = await this.getMacros()
			const controlRooms = await this.getControlRooms()

			this.macros = macros
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

			this.devices = await this.getDevices()
			await this.updateEvents()

			this.updateActions() // export actions
			this.updateFeedbacks() // export feedbacks
			await this.updateVariables() // initialize variables

			this.timeout = setTimeout(() => {
				this.pollVariables()
			}, 1000)

			this.updateStatus(InstanceStatus.Ok)
		} catch (error) {
			this.log('error', `Error during reload: ${error}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		await this.reload()
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

	async updateEvents(): Promise<void> {
		try {
			const events = await this.getUpcomingEvents()
			this.upcomingEvents = events
			this.log('info', `Upcoming Events: ${JSON.stringify(events)}`)
		} catch (e) {
			this.log('error', `Error updating events: ${e}`)
		}
	}

	async updateVariables(): Promise<void> {
		try {
			return UpdateVariables(this)
		} catch (e) {
			this.log('error', `Error updating variables: ${e}`)
		}
	}

	pollVariables(): void {
		this.asyncPollVariables()
			.then(() => {
				this.log('info', 'Variables updated')
			})
			.catch((error) => {
				this.log('error', `Error updating variables: ${error}`)
			})
			.finally(() => {
				this.timeout = setTimeout(() => {
					this.pollVariables()
				}, 1000)
			})
	}

	async asyncPollVariables(): Promise<void> {
		await this.updateEvents()
		await this.updateVariables()
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
