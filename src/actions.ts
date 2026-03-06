import type { CompanionActionDefinitions } from '@companion-module/base'
import type { ModuleInstance, ForceEventDeviceAction } from './main.js'
import { PrimitiveDevice } from './main.js'
import { SetEventVariables } from './variables.js'

export function UpdateActions(self: ModuleInstance): void {
	const actions: CompanionActionDefinitions = {}

	// ── Fire Macro (existing) ──

	actions['fire_macro'] = {
		name: 'Fire Macro',
		options: [
			{
				id: 'macroId',
				type: 'dropdown',
				label: 'Macro',
				default: self.macros[0]?.id ?? '',
				choices: self.macros.map((macro) => ({
					id: macro.id,
					label: macro.name,
				})),
			},
		],
		callback: async (event) => {
			const macroId = event.options.macroId
			let url = `${self.config.host}/cablecastapi/v1/forceevents/customaction/${macroId}`

			const selectedEventId = self.getVariableValue('selected_event_id')
			const selectedEvent = self.upcomingEvents.find((e) => e.scheduleId.toString() === selectedEventId)

			if (selectedEvent && selectedEvent.scheduleId !== -1) {
				url += `?eventScheduleId=${selectedEvent.scheduleId}`
			}

			try {
				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Basic ${Buffer.from(`${self.config.username}:${self.config.password}`).toString('base64')}`,
					},
				})
				if (!response.ok) {
					self.log('error', `CustomAction POST failed: ${response.statusText}`)
				}
			} catch (err) {
				self.log('error', `CustomAction POST error: ${err}`)
			}
		},
	}

	// ── Event Navigation (existing) ──

	actions['next_event'] = {
		name: 'Next Event',
		options: [],
		callback: async () => {
			if (self.upcomingEvents.length === 0) return

			const selectedEventId = self.getVariableValue('selected_event_id')
			const idx = self.upcomingEvents.findIndex((e) => e.scheduleId.toString() === selectedEventId?.toString())
			const nextEvent = self.upcomingEvents[(idx + 1) % self.upcomingEvents.length]

			self.setVariableValues({ selected_event_id: nextEvent.scheduleId.toString() })
			SetEventVariables(self)
		},
	}

	actions['previous_event'] = {
		name: 'Previous Event',
		options: [],
		callback: async () => {
			if (self.upcomingEvents.length === 0) return

			const selectedEventId = self.getVariableValue('selected_event_id')
			const idx = self.upcomingEvents.findIndex((e) => e.scheduleId.toString() === selectedEventId?.toString())
			const prevIdx = idx <= 0 ? self.upcomingEvents.length - 1 : idx - 1
			const prevEvent = self.upcomingEvents[prevIdx]

			self.setVariableValues({ selected_event_id: prevEvent.scheduleId.toString() })
			SetEventVariables(self)
		},
	}

	// ── Play ──

	const playDevices = self.getDeviceChoicesForPrimitive(
		PrimitiveDevice.VIDEO_SERVER,
		PrimitiveDevice.VTR,
		PrimitiveDevice.VTR_TIMECODE,
		PrimitiveDevice.VTR_MULTITAPE,
		PrimitiveDevice.DVD,
		PrimitiveDevice.DVD_MULTIDISC,
	)

	if (playDevices.length > 0) {
		actions['play'] = {
			name: 'Play',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: playDevices[0]?.id ?? 0,
					choices: playDevices,
				},
				{
					id: 'fileKey',
					type: 'textinput',
					label: 'File Key',
					default: '',
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'Play',
							fileKey: String(event.options.fileKey || ''),
						},
					},
				])
			},
		}
	}

	// ── Stop ──

	const allDevices = self.getDeviceChoices()

	if (allDevices.length > 0) {
		actions['stop'] = {
			name: 'Stop',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: allDevices[0]?.id ?? 0,
					choices: allDevices,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'Stop',
						},
					},
				])
			},
		}
	}

	// ── Pause ──

	const pauseDevices = self.getDeviceChoicesForPrimitive(
		PrimitiveDevice.VIDEO_SERVER,
		PrimitiveDevice.VTR,
		PrimitiveDevice.VTR_TIMECODE,
		PrimitiveDevice.VTR_MULTITAPE,
		PrimitiveDevice.DVD,
		PrimitiveDevice.DVD_MULTIDISC,
	)

	if (pauseDevices.length > 0) {
		actions['pause'] = {
			name: 'Pause',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: pauseDevices[0]?.id ?? 0,
					choices: pauseDevices,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'Pause',
						},
					},
				])
			},
		}
	}

	// ── Record ──

	const recordDevices = self.getDeviceChoicesForPrimitive(
		PrimitiveDevice.VIDEO_SERVER,
		PrimitiveDevice.VTR_MULTITAPE,
		PrimitiveDevice.DVD_MULTIDISC,
		PrimitiveDevice.DVD,
		PrimitiveDevice.LIVE_STREAM,
	)

	if (recordDevices.length > 0) {
		actions['record'] = {
			name: 'Record',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: recordDevices[0]?.id ?? 0,
					choices: recordDevices,
				},
				{
					id: 'fileKey',
					type: 'textinput',
					label: 'File Key',
					default: '',
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'Record',
							fileKey: String(event.options.fileKey || ''),
						},
					},
				])
			},
		}
	}

	// ── Record Stop ──

	if (recordDevices.length > 0) {
		actions['record_stop'] = {
			name: 'Record Stop',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: recordDevices[0]?.id ?? 0,
					choices: recordDevices,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'RecordStop',
						},
					},
				])
			},
		}
	}

	// ── Play Stream ──

	const videoServerDevices = self.getDeviceChoicesForPrimitive(PrimitiveDevice.VIDEO_SERVER)

	if (videoServerDevices.length > 0) {
		actions['play_stream'] = {
			name: 'Play Stream',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: videoServerDevices[0]?.id ?? 0,
					choices: videoServerDevices,
				},
				{
					id: 'streamUrl',
					type: 'textinput',
					label: 'Stream URL',
					default: '',
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'PlayStream',
							streamUrl: String(event.options.streamUrl || ''),
						},
					},
				])
			},
		}
	}

	// ── Start Passthrough ──

	const passthroughDevices = self.getPassthroughDeviceChoices()

	if (passthroughDevices.length > 0) {
		actions['start_passthrough'] = {
			name: 'Start Passthrough',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Encoder Device',
					default: passthroughDevices[0]?.id ?? 0,
					choices: passthroughDevices,
				},
				{
					id: 'partnerDevice',
					type: 'dropdown',
					label: 'Decoder Device',
					default: passthroughDevices[0]?.id ?? 0,
					choices: passthroughDevices,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'StartPassthrough',
							output: Number(event.options.partnerDevice),
						},
					},
				])
			},
		}

		actions['stop_passthrough'] = {
			name: 'Stop Passthrough',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: passthroughDevices[0]?.id ?? 0,
					choices: passthroughDevices,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'StopPassthrough',
						},
					},
				])
			},
		}
	}

	// ── Start / Stop RTMP Output ──

	const rtmpDevices = self.getRtmpCapableDeviceChoices()
	const rtmpDestinations = self.getNetworkStreamDestinationChoices()

	if (rtmpDevices.length > 0 && rtmpDestinations.length > 0) {
		actions['start_rtmp_output'] = {
			name: 'Start RTMP Output',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: rtmpDevices[0]?.id ?? 0,
					choices: rtmpDevices,
				},
				{
					id: 'destination',
					type: 'dropdown',
					label: 'Network Stream Destination',
					default: rtmpDestinations[0]?.id ?? 0,
					choices: rtmpDestinations,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'AddOutput',
							networkStreamDestination: Number(event.options.destination),
						},
					},
				])
			},
		}

		actions['stop_rtmp_output'] = {
			name: 'Stop RTMP Output',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: rtmpDevices[0]?.id ?? 0,
					choices: rtmpDevices,
				},
				{
					id: 'destination',
					type: 'dropdown',
					label: 'Network Stream Destination (Stop All = 0)',
					default: 0,
					choices: [{ id: 0, label: 'Stop All Outputs' }, ...rtmpDestinations],
				},
			],
			callback: async (event) => {
				const destinationId = Number(event.options.destination)
				if (destinationId === 0) {
					// Stop all outputs
					await self.postForceEvents([
						{
							deviceAction: {
								device: Number(event.options.device),
								action: 'RemoveOutput',
							},
						},
					])
				} else {
					// Find the specific output from current device status to get the outputId and internalId
					const deviceId = Number(event.options.device)
					const deviceStatus = self.automationStatus.deviceStatus.find((ds) => ds.id === deviceId)
					const output = deviceStatus?.outputs?.find((o) => o.internalId === destinationId.toString())
					await self.postForceEvents([
						{
							deviceAction: {
								device: deviceId,
								action: 'RemoveOutput',
								outputId: output?.id ?? null,
								outputInternalId: destinationId.toString(),
							},
						},
					])
				}
			},
		}
	}

	// ── Start / Stop Transcribing ──

	const transcriptionDevices = self.getTranscriptionDeviceChoices()

	if (transcriptionDevices.length > 0) {
		actions['start_transcribing'] = {
			name: 'Start Transcribing',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: transcriptionDevices[0]?.id ?? 0,
					choices: transcriptionDevices,
				},
				{
					id: 'language',
					type: 'textinput',
					label: 'Language (e.g. en-US)',
					default: 'en-US',
				},
				{
					id: 'translationLanguage',
					type: 'textinput',
					label: 'Translation Language (optional)',
					default: '',
				},
			],
			callback: async (event) => {
				const deviceAction: ForceEventDeviceAction = {
					device: Number(event.options.device),
					action: 'StartProcessing',
					transcribeLanguage: String(event.options.language || 'en-US'),
				}
				const translateLang = String(event.options.translationLanguage || '')
				if (translateLang) {
					deviceAction.translateLanguage = translateLang
				}
				await self.postForceEvents([{ deviceAction }])
			},
		}

		actions['stop_transcribing'] = {
			name: 'Stop Transcribing',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: transcriptionDevices[0]?.id ?? 0,
					choices: transcriptionDevices,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'StopProcessing',
						},
					},
				])
			},
		}
	}

	// ── Change Caption Mode ──

	const captionDevices = self.getDeviceChoicesForPrimitive(PrimitiveDevice.CLOSED_CAPTION)

	if (captionDevices.length > 0) {
		actions['change_caption_mode'] = {
			name: 'Change Caption Mode',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: captionDevices[0]?.id ?? 0,
					choices: captionDevices,
				},
				{
					id: 'mode',
					type: 'dropdown',
					label: 'Mode',
					default: 'offline',
					choices: [
						{ id: 'offline', label: 'Offline Mode' },
						{ id: 'realtime', label: 'Realtime Mode' },
					],
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						deviceAction: {
							device: Number(event.options.device),
							action: 'SetProperty',
							propertyName: 'captioningMode',
							propertyValue: String(event.options.mode),
						},
					},
				])
			},
		}
	}

	// ── Switch Event ──

	const switchDevices = self.getPlayerDeviceChoices()
	const outputChoices = self.getOutputChoices()

	if (switchDevices.length > 0 && outputChoices.length > 0) {
		actions['switch'] = {
			name: 'Switch',
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Source Device',
					default: switchDevices[0]?.id ?? 0,
					choices: switchDevices,
				},
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					default: outputChoices[0]?.id ?? 0,
					choices: outputChoices,
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						switchEvent: {
							device: Number(event.options.device),
							output: Number(event.options.output),
						},
					},
				])
			},
		}
	}

	// ── Automation Override ──

	if (outputChoices.length > 0) {
		actions['automation_override'] = {
			name: 'Automation Override',
			options: [
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					default: outputChoices[0]?.id ?? 0,
					choices: outputChoices,
				},
				{
					id: 'override',
					type: 'dropdown',
					label: 'Override',
					default: 'true',
					choices: [
						{ id: 'true', label: 'Enable Override' },
						{ id: 'false', label: 'Disable Override (Resume)' },
					],
				},
				{
					id: 'doLastSwitchOnResume',
					type: 'dropdown',
					label: 'Do Last Switch On Resume',
					default: 'true',
					choices: [
						{ id: 'true', label: 'Yes' },
						{ id: 'false', label: 'No' },
					],
				},
			],
			callback: async (event) => {
				await self.postForceEvents([
					{
						automationOverride: {
							output: Number(event.options.output),
							override: event.options.override === 'true',
							doLastSwitchOnResume: event.options.doLastSwitchOnResume === 'true',
						},
					},
				])
			},
		}
	}

	self.setActionDefinitions(actions)
}
