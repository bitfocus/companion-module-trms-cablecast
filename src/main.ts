import { InstanceBase, InstanceStatus, runEntrypoint, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariableValues } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'

// ── Enums ──

export enum PrimitiveDevice {
	NONE = 0,
	VTR = 1,
	VTR_TIMECODE = 2,
	DVD = 3,
	DVD_MULTIDISC = 4,
	VIDEO_SERVER = 5,
	LIVE = 6,
	VTR_MULTITAPE = 8,
	CG = 9,
	LIVE_STREAM = 10,
	CLOSED_CAPTION = 11,
}

export enum DeviceType {
	DT_NONE = 0,
	DT_PLAYER = 1,
	DT_RECORDER = 2,
	DT_BOTH = 3,
	DT_GPI = 5,
}

// ── API Data Interfaces ──

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
	id: number
	name: string
	deviceType: DeviceType
	primitiveDevice: PrimitiveDevice
	supportsPassthrough: boolean
	supportsNetworkStream: boolean
	active: boolean
}

export interface Output {
	id: number
	name: string
	location: number
	active: boolean
	primaryDevice: number | null
}

export interface NetworkStreamDestination {
	id: number
	name: string
	locationId: number
	streamType: number
	rtmpStreamUrl: string
	rtmpStreamKey: string
}

export interface NetworkStream {
	id: number
	name: string
	locationID: number
	streamType: number
	captionsEnabled: boolean
}

export interface CablecastEvent {
	scheduleId: number
	runDateTime?: string
	endDateTime?: string
	channelId: number
	channelName?: string
	showTitle?: string
}

// ── Automation Status Interfaces ──

export interface DeviceStatusDto {
	id: number
	device: number
	level: string
	errorDescription: string
	action: string
	statusDescription: string
	positionInFrames: number | null
	frameRate: number
	droppedFrameCount: number
	fileName: string | null
	filePath: string | null
	automationOverriden: boolean
	encoderVideoPresent: boolean
	encoderVideoResolutionValid: boolean
	encoderConfiguredResolution: string | null
	encoderDetectedResolution: string | null
	decoderOutputResolution: string | null
	videoResolution: string | null
	transcribeActive: boolean
	transcribeLanguage: string | null
	translationLanguage: string | null
	outputs: DeviceStatusOutput[]
}

export interface DeviceStatusOutput {
	id: number
	type: string
	internalId: string
}

export interface OutputPatchDto {
	id: number
	device: number | null
	output: number | null
	automationOverriden: boolean | null
}

export interface PassthroughStatusDto {
	id: number
	device: number
	partners: number[]
	passthroughRole: string // None, Encoder, Decoder
}

export interface NetworkStreamStatusDto {
	id: number
	networkStream: number
	address: string
	connected: boolean
	streaming: boolean
	detectedResolution: string | null
}

export interface RouterStatus {
	level: string
	errorDescription: string | null
}

export interface AllowedActionsDto {
	device: number
	actions: string[]
}

export interface CustomActionEventDto {
	id: string
	status: string // Running, Completed, Error
}

export interface AutomationStatusResource {
	deviceStatus: DeviceStatusDto[]
	outputPatches: OutputPatchDto[]
	passthroughStatus: PassthroughStatusDto[]
	networkStreamStatus: NetworkStreamStatusDto[]
	routerStatus: RouterStatus
	allowedActions: AllowedActionsDto[]
	customActionEvents: CustomActionEventDto[]
}

// ── Force Event Interfaces ──

export interface ForceEventDeviceAction {
	device: number
	action: string
	output?: number | null
	fileKey?: string
	streamUrl?: string
	propertyName?: string
	propertyValue?: string
	transcribeLanguage?: string
	translateLanguage?: string
	networkStreamDestination?: number
	outputId?: number | null
	outputInternalId?: string
}

export interface ForceEventSwitch {
	device: number
	output: number
}

export interface ForceEventAutomationOverride {
	override: boolean
	output: number
	doLastSwitchOnResume: boolean
}

export interface ForceEventDto {
	deviceAction?: ForceEventDeviceAction
	switchEvent?: ForceEventSwitch
	automationOverride?: ForceEventAutomationOverride
}

// ── Module Instance ──

export class ModuleInstance extends InstanceBase<ModuleConfig> {
	controlRooms: ControlRoom[] = []
	macros: Macro[] = []
	devices: Device[] = []
	outputs: Output[] = []
	networkStreamDestinations: NetworkStreamDestination[] = []
	networkStreams: NetworkStream[] = []
	upcomingEvents: CablecastEvent[] = []
	automationStatus: AutomationStatusResource = {
		deviceStatus: [],
		outputPatches: [],
		passthroughStatus: [],
		networkStreamStatus: [],
		routerStatus: { level: 'Success', errorDescription: null },
		allowedActions: [],
		customActionEvents: [],
	}
	timeout: NodeJS.Timeout | null = null
	config!: ModuleConfig

	constructor(internal: unknown) {
		super(internal)
	}

	// ── Auth Header Helper ──

	authHeaders(): Record<string, string> {
		return {
			'Content-Type': 'application/json',
			Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
		}
	}

	// ── API Fetch Helpers ──

	private async apiFetch<T>(path: string, defaultValue: T): Promise<T> {
		try {
			const response = await fetch(`${this.config.host}/cablecastapi/v1/${path}`, {
				headers: this.authHeaders(),
			})
			if (!response.ok) {
				this.log('error', `Error fetching ${path}: ${response.statusText}`)
				return defaultValue
			}
			return (await response.json()) as T
		} catch (e) {
			this.log('error', `Fetching ${path} failed: ${e}`)
			return defaultValue
		}
	}

	async getControlRooms(): Promise<ControlRoom[]> {
		const data = await this.apiFetch<{ controlRooms: ControlRoom[] }>('controlrooms', { controlRooms: [] })
		return data.controlRooms
	}

	async getMacros(): Promise<Macro[]> {
		const data = await this.apiFetch<{ macros: Macro[] }>('macros', { macros: [] })
		return data.macros
	}

	async getDevices(): Promise<Device[]> {
		const data = await this.apiFetch<{ devices: Device[] }>('devices', { devices: [] })
		return data.devices
	}

	async getOutputs(): Promise<Output[]> {
		const data = await this.apiFetch<{ outputs: Output[] }>('outputs', { outputs: [] })
		return data.outputs
	}

	async getNetworkStreamDestinations(): Promise<NetworkStreamDestination[]> {
		const data = await this.apiFetch<{ networkStreamDestinations: NetworkStreamDestination[] }>(
			'networkstreamdestinations',
			{ networkStreamDestinations: [] },
		)
		return data.networkStreamDestinations
	}

	async getNetworkStreams(): Promise<NetworkStream[]> {
		const data = await this.apiFetch<{ networkStreams: NetworkStream[] }>('networkstreams', { networkStreams: [] })
		return data.networkStreams
	}

	async getUpcomingEvents(): Promise<CablecastEvent[]> {
		const defaultEvents: CablecastEvent[] = [
			{
				channelId: -1,
				scheduleId: -1,
				channelName: '--None--',
				showTitle: '--None--',
			},
		]

		const data = await this.apiFetch<{ events: CablecastEvent[] }>(
			`controlrooms/upcomingevents?location=${this.config.locationId}`,
			{ events: [] },
		)
		return [...defaultEvents, ...data.events]
	}

	async getAutomationStatus(): Promise<AutomationStatusResource> {
		const empty: AutomationStatusResource = {
			deviceStatus: [],
			outputPatches: [],
			passthroughStatus: [],
			networkStreamStatus: [],
			routerStatus: { level: 'Success', errorDescription: null },
			allowedActions: [],
			customActionEvents: [],
		}
		return this.apiFetch<AutomationStatusResource>(`automationstatus/?location=${this.config.locationId}`, empty)
	}

	// ── Force Event POST ──

	async postForceEvents(forceEvents: ForceEventDto[]): Promise<void> {
		try {
			const response = await fetch(`${this.config.host}/cablecastapi/v1/forceevents`, {
				method: 'POST',
				headers: this.authHeaders(),
				body: JSON.stringify({ forceEvents }),
			})
			if (!response.ok) {
				this.log('error', `ForceEvent POST failed: ${response.statusText}`)
			} else {
				this.log('info', 'ForceEvent POST succeeded')
			}
		} catch (err) {
			this.log('error', `ForceEvent POST error: ${err}`)
		}
	}

	// ── Device Helpers ──

	getDeviceChoices(): { id: number; label: string }[] {
		return this.devices.filter((d) => d.active).map((d) => ({ id: d.id, label: d.name }))
	}

	getDeviceChoicesForPrimitive(...primitives: PrimitiveDevice[]): { id: number; label: string }[] {
		return this.devices
			.filter((d) => d.active && primitives.includes(d.primitiveDevice))
			.map((d) => ({ id: d.id, label: d.name }))
	}

	getPlayerDeviceChoices(): { id: number; label: string }[] {
		return this.devices
			.filter(
				(d) =>
					d.active &&
					(d.deviceType === DeviceType.DT_PLAYER || d.deviceType === DeviceType.DT_BOTH) &&
					d.primitiveDevice !== PrimitiveDevice.CG,
			)
			.map((d) => ({ id: d.id, label: d.name }))
	}

	getPassthroughDeviceChoices(): { id: number; label: string }[] {
		return this.devices.filter((d) => d.active && d.supportsPassthrough).map((d) => ({ id: d.id, label: d.name }))
	}

	getRtmpCapableDeviceChoices(): { id: number; label: string }[] {
		return this.devices
			.filter(
				(d) =>
					d.active &&
					(d.primitiveDevice === PrimitiveDevice.VIDEO_SERVER || d.primitiveDevice === PrimitiveDevice.LIVE_STREAM),
			)
			.map((d) => ({ id: d.id, label: d.name }))
	}

	getTranscriptionDeviceChoices(): { id: number; label: string }[] {
		return this.devices
			.filter((d) => d.active && d.primitiveDevice === PrimitiveDevice.VIDEO_SERVER)
			.map((d) => ({ id: d.id, label: d.name }))
	}

	getOutputChoices(): { id: number; label: string }[] {
		return this.outputs.filter((o) => o.active).map((o) => ({ id: o.id, label: o.name }))
	}

	getNetworkStreamDestinationChoices(): { id: number; label: string }[] {
		return this.networkStreamDestinations.map((d) => ({ id: d.id, label: d.name }))
	}

	getDeviceName(id: number): string {
		return this.devices.find((d) => d.id === id)?.name ?? `Device ${id}`
	}

	// ── Lifecycle ──

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		await this.reload()
	}

	async reload(): Promise<void> {
		if (this.timeout) {
			clearTimeout(this.timeout)
			this.timeout = null
		}

		if (!this.config.host || !this.config.username || !this.config.password) {
			this.log('warn', 'Module not configured')
			this.updateStatus(InstanceStatus.Disconnected)
			return
		}

		try {
			const [macros, controlRooms, devices, outputs, networkStreamDestinations, networkStreams] = await Promise.all([
				this.getMacros(),
				this.getControlRooms(),
				this.getDevices(),
				this.getOutputs(),
				this.getNetworkStreamDestinations(),
				this.getNetworkStreams(),
			])

			this.controlRooms = controlRooms
			this.macros = macros
				.map((macro) => {
					const controlRoom = controlRooms.find((cr) => cr.id.toString() === macro.controlRoom.toString())
					return {
						id: macro.id,
						name: `${controlRoom?.name} - ${macro.name}`,
					} as Macro
				})
				.sort((a, b) => a.name.localeCompare(b.name))

			this.devices = devices
			this.outputs = outputs
			this.networkStreamDestinations = networkStreamDestinations
			this.networkStreams = networkStreams

			await this.updateEvents()

			// Fetch initial automation status so allowedActions is populated before building actions
			this.automationStatus = await this.getAutomationStatus()

			this.updateActions()
			this.updateFeedbacks()
			this.updatePresets()
			UpdateVariableDefinitions(this)
			await this.updateVariableValues()

			this.pollVariables()
			this.updateStatus(InstanceStatus.Ok)
		} catch (error) {
			this.log('error', `Error during reload: ${error}`)
			this.updateStatus(InstanceStatus.ConnectionFailure)
		}
	}

	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		if (this.timeout) {
			clearTimeout(this.timeout)
			this.timeout = null
		}
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		await this.reload()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	async updateEvents(): Promise<void> {
		try {
			this.upcomingEvents = await this.getUpcomingEvents()
		} catch (e) {
			this.log('error', `Error updating events: ${e}`)
		}
	}

	async updateVariableValues(): Promise<void> {
		try {
			await UpdateVariableValues(this)
		} catch (e) {
			this.log('error', `Error updating variables: ${e}`)
		}
	}

	pollVariables(): void {
		this.asyncPollVariables()
			.catch((error) => {
				this.log('error', `Error updating variables: ${error}`)
			})
			.finally(() => {
				if (this.timeout) {
					clearTimeout(this.timeout)
				}
				const interval = this.config.pollInterval || 1000
				this.timeout = setTimeout(() => this.pollVariables(), interval)
			})
	}

	async asyncPollVariables(): Promise<void> {
		await this.updateEvents()
		this.automationStatus = await this.getAutomationStatus()
		await this.updateVariableValues()
		this.checkAllFeedbacks()
	}

	checkAllFeedbacks(): void {
		this.checkFeedbacks(
			'device_state',
			'device_error',
			'passthrough_active',
			'output_override_active',
			'output_routed_to_device',
			'caption_active',
			'rtmp_streaming',
			'encoder_video_present',
			'stream_connected',
			'router_healthy',
		)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
