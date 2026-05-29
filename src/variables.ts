import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const defs: CompanionVariableDefinition[] = []

	// ── Event Selection Variables ──

	defs.push(
		{ name: 'Selected Event ID', variableId: 'selected_event_id' },
		{ name: 'Selected Event Show Title', variableId: 'selected_event_show_title' },
		{ name: 'Selected Event Channel Name', variableId: 'selected_event_channel_name' },
		{ name: 'Selected Event Start', variableId: 'selected_event_start' },
		{ name: 'Selected Event End', variableId: 'selected_event_end' },
	)

	// ── Per-Device Variables ──

	for (const device of self.devices) {
		const id = device.id
		const n = device.name
		defs.push(
			// Existing
			{ name: `Device State: ${n}`, variableId: `device_state_${id}` },
			{ name: `Device Position: ${n}`, variableId: `device_position_${id}` },
			{ name: `Device Position Timecode: ${n}`, variableId: `device_position_timecode_${id}` },
			{ name: `Device Position Hours: ${n}`, variableId: `device_position_hours_${id}` },
			{ name: `Device Position Minutes: ${n}`, variableId: `device_position_minutes_${id}` },
			{ name: `Device Position Seconds: ${n}`, variableId: `device_position_seconds_${id}` },
			{ name: `File Key: ${n}`, variableId: `device_filekey_${id}` },
			{ name: `Transcribe Active: ${n}`, variableId: `device_transcribe_active_${id}` },
			// New status fields
			{ name: `Status Level: ${n}`, variableId: `device_status_level_${id}` },
			{ name: `Status Description: ${n}`, variableId: `device_status_description_${id}` },
			{ name: `Error: ${n}`, variableId: `device_error_${id}` },
			{ name: `Dropped Frames: ${n}`, variableId: `device_dropped_frames_${id}` },
			{ name: `Encoder Video Present: ${n}`, variableId: `device_encoder_video_present_${id}` },
			{ name: `Encoder Resolution Valid: ${n}`, variableId: `device_encoder_resolution_valid_${id}` },
			{ name: `Encoder Configured Resolution: ${n}`, variableId: `device_encoder_configured_res_${id}` },
			{ name: `Encoder Detected Resolution: ${n}`, variableId: `device_encoder_detected_res_${id}` },
			{ name: `Decoder Output Resolution: ${n}`, variableId: `device_decoder_output_res_${id}` },
			{ name: `Video Resolution: ${n}`, variableId: `device_video_resolution_${id}` },
			{ name: `Automation Overridden: ${n}`, variableId: `device_automation_overridden_${id}` },
			{ name: `Transcribe Language: ${n}`, variableId: `device_transcribe_language_${id}` },
			{ name: `Translation Language: ${n}`, variableId: `device_translation_language_${id}` },
			// Passthrough
			{ name: `Passthrough Active: ${n}`, variableId: `device_passthrough_active_${id}` },
			{ name: `Passthrough Role: ${n}`, variableId: `device_passthrough_role_${id}` },
			{ name: `Passthrough Partners: ${n}`, variableId: `device_passthrough_partners_${id}` },
			// RTMP
			{ name: `RTMP Active: ${n}`, variableId: `device_rtmp_active_${id}` },
			{ name: `RTMP Output Count: ${n}`, variableId: `device_rtmp_output_count_${id}` },
		)
	}

	// ── Per-Output Variables ──

	for (const output of self.outputs) {
		if (!output.active) continue
		const id = output.id
		const n = output.name
		defs.push(
			{ name: `Output Current Device: ${n}`, variableId: `output_current_device_${id}` },
			{ name: `Output Override Active: ${n}`, variableId: `output_override_active_${id}` },
		)
	}

	// ── Per-Network-Stream Variables ──

	for (const stream of self.networkStreams) {
		const id = stream.id
		const n = stream.name
		defs.push(
			{ name: `Stream Connected: ${n}`, variableId: `stream_connected_${id}` },
			{ name: `Stream Streaming: ${n}`, variableId: `stream_streaming_${id}` },
			{ name: `Stream Address: ${n}`, variableId: `stream_address_${id}` },
			{ name: `Stream Resolution: ${n}`, variableId: `stream_detected_resolution_${id}` },
		)
	}

	// ── Router Status ──

	defs.push(
		{ name: 'Router Status Level', variableId: 'router_status_level' },
		{ name: 'Router Error', variableId: 'router_error' },
	)

	self.setVariableDefinitions(defs)
}

export async function UpdateVariableValues(self: ModuleInstance): Promise<void> {
	const vals: CompanionVariableValues = {}
	const status = self.automationStatus

	// ── Event Variables ──

	SetEventVariables(self)

	// ── Device Status Variables ──

	for (const ds of status.deviceStatus) {
		const device = self.devices.find((d) => d.id === ds.id)
		if (!device) continue

		const id = device.id

		// Existing variables
		vals[`device_state_${id}`] = ds.action
		vals[`device_filekey_${id}`] = ds.fileName || 'None'
		vals[`device_transcribe_active_${id}`] = ds.transcribeActive

		// Position calculation
		const positionInFrames = ds.positionInFrames
		let hours = 'None'
		let minutes = 'None'
		let seconds = 'None'
		if (typeof positionInFrames === 'number' && ds.frameRate) {
			const totalSeconds = Math.floor(positionInFrames / ds.frameRate)
			hours = Math.floor(totalSeconds / 3600)
				.toString()
				.padStart(2, '0')
			minutes = Math.floor((totalSeconds % 3600) / 60)
				.toString()
				.padStart(2, '0')
			seconds = (totalSeconds % 60).toString().padStart(2, '0')
		}
		vals[`device_position_${id}`] = positionInFrames ?? 'None'
		vals[`device_position_timecode_${id}`] = hours === 'None' ? 'None' : `${hours}:${minutes}:${seconds}`
		vals[`device_position_hours_${id}`] = hours
		vals[`device_position_minutes_${id}`] = minutes
		vals[`device_position_seconds_${id}`] = seconds

		// New status fields
		vals[`device_status_level_${id}`] = ds.level ?? ''
		vals[`device_status_description_${id}`] = ds.statusDescription ?? ''
		vals[`device_error_${id}`] = ds.errorDescription ?? ''
		vals[`device_dropped_frames_${id}`] = ds.droppedFrameCount ?? 0
		vals[`device_encoder_video_present_${id}`] = ds.encoderVideoPresent ?? false
		vals[`device_encoder_resolution_valid_${id}`] = ds.encoderVideoResolutionValid ?? false
		vals[`device_encoder_configured_res_${id}`] = ds.encoderConfiguredResolution ?? ''
		vals[`device_encoder_detected_res_${id}`] = ds.encoderDetectedResolution ?? ''
		vals[`device_decoder_output_res_${id}`] = ds.decoderOutputResolution ?? ''
		vals[`device_video_resolution_${id}`] = ds.videoResolution ?? ''
		vals[`device_automation_overridden_${id}`] = ds.automationOverriden ?? false
		vals[`device_transcribe_language_${id}`] = ds.transcribeLanguage ?? ''
		vals[`device_translation_language_${id}`] = ds.translationLanguage ?? ''

		// RTMP output status
		const rtmpOutputs = ds.outputs?.filter((o) => o.type === 'RTMP') ?? []
		vals[`device_rtmp_active_${id}`] = rtmpOutputs.length > 0
		vals[`device_rtmp_output_count_${id}`] = rtmpOutputs.length
	}

	// ── Passthrough Status ──

	// First set defaults for all devices
	for (const device of self.devices) {
		vals[`device_passthrough_active_${device.id}`] = false
		vals[`device_passthrough_role_${device.id}`] = 'None'
		vals[`device_passthrough_partners_${device.id}`] = ''
	}
	// Then override with actual passthrough data
	for (const pt of status.passthroughStatus) {
		const device = self.devices.find((d) => d.id === pt.device)
		if (!device) continue
		vals[`device_passthrough_active_${device.id}`] = true
		vals[`device_passthrough_role_${device.id}`] = pt.passthroughRole
		const partnerNames = pt.partners.map((pid) => self.getDeviceName(pid)).join(', ')
		vals[`device_passthrough_partners_${device.id}`] = partnerNames
	}

	// ── Output Patch Variables ──

	for (const patch of status.outputPatches) {
		if (patch.output == null) continue
		const deviceName = patch.device != null ? self.getDeviceName(patch.device) : 'None'
		vals[`output_current_device_${patch.output}`] = deviceName
		vals[`output_override_active_${patch.output}`] = patch.automationOverriden ?? false
	}

	// ── Network Stream Status ──

	for (const ns of status.networkStreamStatus) {
		const stream = self.networkStreams.find((s) => s.id === ns.networkStream)
		if (!stream) continue
		vals[`stream_connected_${stream.id}`] = ns.connected
		vals[`stream_streaming_${stream.id}`] = ns.streaming
		vals[`stream_address_${stream.id}`] = ns.address ?? ''
		vals[`stream_detected_resolution_${stream.id}`] = ns.detectedResolution ?? ''
	}

	// ── Router Status ──

	vals['router_status_level'] = status.routerStatus?.level ?? ''
	vals['router_error'] = status.routerStatus?.errorDescription ?? ''

	self.setVariableValues(vals)
}

// ── Event Variable Helpers ──

export function SetEventVariables(self: ModuleInstance): void {
	if (!self.upcomingEvents || self.upcomingEvents.length === 0) {
		self.setVariableValues({
			selected_event_id: '',
			selected_event_show_title: 'No Upcoming Events',
			selected_event_channel_name: 'No Upcoming Events',
			selected_event_start: 'No Upcoming Events',
			selected_event_end: 'No Upcoming Events',
		})
		return
	}

	const selectedEventId = self.getVariableValue('selected_event_id')
	const selectedEvent = self.upcomingEvents.find((event) => event.scheduleId.toString() === selectedEventId)

	if (!selectedEvent) {
		const firstEvent = self.upcomingEvents[0]
		self.setVariableValues({
			selected_event_id: firstEvent.scheduleId.toString(),
			selected_event_show_title: firstEvent.showTitle || 'No Show Title',
			selected_event_channel_name: firstEvent.channelName || 'No Channel Name',
			selected_event_start: FormatDateTimeString(firstEvent.runDateTime) || 'No Start Time',
			selected_event_end: FormatDateTimeString(firstEvent.endDateTime) || 'No End Time',
		})
		return
	}

	self.setVariableValues({
		selected_event_show_title: selectedEvent.showTitle || 'No Show Title',
		selected_event_channel_name: selectedEvent.channelName || 'No Channel Name',
		selected_event_start: FormatDateTimeString(selectedEvent.runDateTime) || 'No Start Time',
		selected_event_end: FormatDateTimeString(selectedEvent.endDateTime) || 'No End Time',
	})
}

function FormatDateTimeString(inputDateString?: string): string | undefined {
	if (!inputDateString) return undefined
	const d = new Date(inputDateString)
	return `${GetMonthAbbreviation(d.getMonth())} ${d.getDate()}, ${d.getFullYear()} ${FormatTime(d.getHours(), d.getMinutes())}`
}

function GetMonthAbbreviation(monthIndex: number): string {
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	return months[monthIndex]
}

function FormatTime(hours: number, minutes: number): string {
	const ampm = hours >= 12 ? 'PM' : 'AM'
	const h = hours % 12 === 0 ? 12 : hours % 12
	const m = minutes < 10 ? `0${minutes}` : minutes
	return `${h}:${m} ${ampm}`
}
