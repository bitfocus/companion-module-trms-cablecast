import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export function UpdateFeedbacks(self: ModuleInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	const allDevices = self.getDeviceChoices()
	const outputChoices = self.getOutputChoices()

	// ── device_state: Device is in a specific state ──

	if (allDevices.length > 0) {
		feedbacks['device_state'] = {
			type: 'boolean',
			name: 'Device State',
			description: 'Change button appearance when a device is in a specific state',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: allDevices[0]?.id ?? 0,
					choices: allDevices,
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'play',
					choices: [
						{ id: 'play', label: 'Playing' },
						{ id: 'stop', label: 'Stopped' },
						{ id: 'pause', label: 'Paused' },
						{ id: 'record', label: 'Recording' },
						{ id: 'playStream', label: 'Playing Stream' },
						{ id: 'cue', label: 'Cueing' },
						{ id: 'cueStream', label: 'Cueing Stream' },
						{ id: 'load', label: 'Loading' },
						{ id: 'startPassthrough', label: 'Passthrough' },
					],
				},
			],
			callback: (feedback) => {
				const deviceId = Number(feedback.options.device)
				const ds = self.automationStatus.deviceStatus.find((d) => d.id === deviceId)
				return ds?.action === feedback.options.state
			},
		}
	}

	// ── device_error: Device has error or warning ──

	if (allDevices.length > 0) {
		feedbacks['device_error'] = {
			type: 'boolean',
			name: 'Device Error',
			description: 'Change button appearance when a device has an error or warning',
			defaultStyle: {
				bgcolor: combineRgb(204, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: allDevices[0]?.id ?? 0,
					choices: allDevices,
				},
				{
					id: 'level',
					type: 'dropdown',
					label: 'Level',
					default: 'any',
					choices: [
						{ id: 'any', label: 'Any (Error or Warning)' },
						{ id: 'Error', label: 'Error' },
						{ id: 'Warning', label: 'Warning' },
					],
				},
			],
			callback: (feedback) => {
				const deviceId = Number(feedback.options.device)
				const ds = self.automationStatus.deviceStatus.find((d) => d.id === deviceId)
				if (!ds) return false
				if (feedback.options.level === 'any') {
					return ds.level === 'Error' || ds.level === 'Warning'
				}
				return ds.level === feedback.options.level
			},
		}
	}

	// ── passthrough_active: Device is in passthrough ──

	const passthroughDevices = self.getPassthroughDeviceChoices()

	if (passthroughDevices.length > 0) {
		feedbacks['passthrough_active'] = {
			type: 'boolean',
			name: 'Passthrough Active',
			description: 'Change button appearance when a device is in passthrough mode',
			defaultStyle: {
				bgcolor: combineRgb(102, 0, 204),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: passthroughDevices[0]?.id ?? 0,
					choices: passthroughDevices,
				},
			],
			callback: (feedback) => {
				const deviceId = Number(feedback.options.device)
				return self.automationStatus.passthroughStatus.some((pt) => pt.device === deviceId)
			},
		}
	}

	// ── output_override_active: Output automation is overridden ──

	if (outputChoices.length > 0) {
		feedbacks['output_override_active'] = {
			type: 'boolean',
			name: 'Output Override Active',
			description: 'Change button appearance when an output has automation overridden',
			defaultStyle: {
				bgcolor: combineRgb(204, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					default: outputChoices[0]?.id ?? 0,
					choices: outputChoices,
				},
			],
			callback: (feedback) => {
				const outputId = Number(feedback.options.output)
				const patch = self.automationStatus.outputPatches.find((p) => p.output === outputId)
				return patch?.automationOverriden === true
			},
		}
	}

	// ── output_routed_to_device: Specific device is routed to output ──

	if (outputChoices.length > 0 && allDevices.length > 0) {
		feedbacks['output_routed_to_device'] = {
			type: 'boolean',
			name: 'Output Routed To Device',
			description: 'Change button appearance when a specific device is routed to an output',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'output',
					type: 'dropdown',
					label: 'Output',
					default: outputChoices[0]?.id ?? 0,
					choices: outputChoices,
				},
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: allDevices[0]?.id ?? 0,
					choices: allDevices,
				},
			],
			callback: (feedback) => {
				const outputId = Number(feedback.options.output)
				const deviceId = Number(feedback.options.device)
				const patch = self.automationStatus.outputPatches.find((p) => p.output === outputId)
				return patch?.device === deviceId
			},
		}
	}

	// ── caption_active: Device is transcribing ──

	const transcriptionDevices = self.getTranscriptionDeviceChoices()

	if (transcriptionDevices.length > 0) {
		feedbacks['caption_active'] = {
			type: 'boolean',
			name: 'Caption Active',
			description: 'Change button appearance when a device is actively transcribing',
			defaultStyle: {
				bgcolor: combineRgb(0, 102, 204),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: transcriptionDevices[0]?.id ?? 0,
					choices: transcriptionDevices,
				},
			],
			callback: (feedback) => {
				const deviceId = Number(feedback.options.device)
				const ds = self.automationStatus.deviceStatus.find((d) => d.id === deviceId)
				return ds?.transcribeActive === true
			},
		}
	}

	// ── rtmp_streaming: Device has active RTMP output ──

	const rtmpDevices = self.getRtmpCapableDeviceChoices()

	if (rtmpDevices.length > 0) {
		feedbacks['rtmp_streaming'] = {
			type: 'boolean',
			name: 'RTMP Streaming',
			description: 'Change button appearance when a device has active RTMP output(s)',
			defaultStyle: {
				bgcolor: combineRgb(204, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: rtmpDevices[0]?.id ?? 0,
					choices: rtmpDevices,
				},
			],
			callback: (feedback) => {
				const deviceId = Number(feedback.options.device)
				const ds = self.automationStatus.deviceStatus.find((d) => d.id === deviceId)
				return (ds?.outputs?.filter((o) => o.type === 'RTMP')?.length ?? 0) > 0
			},
		}
	}

	// ── encoder_video_present: Encoder has video signal ──

	const encoderDevices = self.getRtmpCapableDeviceChoices()

	if (encoderDevices.length > 0) {
		feedbacks['encoder_video_present'] = {
			type: 'boolean',
			name: 'Encoder Video Present',
			description: 'Change button appearance based on whether an encoder has a video signal',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'device',
					type: 'dropdown',
					label: 'Device',
					default: encoderDevices[0]?.id ?? 0,
					choices: encoderDevices,
				},
			],
			callback: (feedback) => {
				const deviceId = Number(feedback.options.device)
				const ds = self.automationStatus.deviceStatus.find((d) => d.id === deviceId)
				return ds?.encoderVideoPresent === true
			},
		}
	}

	// ── stream_connected: Network stream is connected ──

	const streamChoices = self.networkStreams.map((s) => ({ id: s.id, label: s.name }))

	if (streamChoices.length > 0) {
		feedbacks['stream_connected'] = {
			type: 'boolean',
			name: 'Stream Connected',
			description: 'Change button appearance when a network stream is connected',
			defaultStyle: {
				bgcolor: combineRgb(0, 204, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'stream',
					type: 'dropdown',
					label: 'Network Stream',
					default: streamChoices[0]?.id ?? 0,
					choices: streamChoices,
				},
			],
			callback: (feedback) => {
				const streamId = Number(feedback.options.stream)
				const ns = self.automationStatus.networkStreamStatus.find((s) => s.networkStream === streamId)
				return ns?.connected === true
			},
		}
	}

	// ── router_healthy: Router has no errors ──

	feedbacks['router_healthy'] = {
		type: 'boolean',
		name: 'Router Healthy',
		description: 'Change button appearance based on router health status',
		defaultStyle: {
			bgcolor: combineRgb(0, 204, 0),
			color: combineRgb(0, 0, 0),
		},
		options: [],
		callback: () => {
			return self.automationStatus.routerStatus?.level !== 'Error'
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
