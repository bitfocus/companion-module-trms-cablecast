import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'
import { type ModuleInstance, PrimitiveDevice, DeviceType } from './main.js'

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions = {}

	// ── Per-Device Presets ──

	for (const device of self.devices) {
		if (!device.active) continue

		const prim = device.primitiveDevice
		const devType = device.deviceType
		const id = device.id
		const name = device.name

		// -- Status Display (all devices) --
		presets[`device_status_${id}`] = {
			type: 'button',
			category: `Device: ${name}`,
			name: `${name} Status`,
			style: {
				text: `${name}\\n$(cablecast:device_state_${id})\\n$(cablecast:device_position_hours_${id}):$(cablecast:device_position_minutes_${id}):$(cablecast:device_position_seconds_${id})`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'device_error',
					options: { device: id, level: 'any' },
					style: { bgcolor: combineRgb(204, 0, 0) },
				},
			],
		}

		// -- Play (VIDEO_SERVER, VTR variants, DVD variants) --
		if (
			[
				PrimitiveDevice.VIDEO_SERVER,
				PrimitiveDevice.VTR,
				PrimitiveDevice.VTR_TIMECODE,
				PrimitiveDevice.VTR_MULTITAPE,
				PrimitiveDevice.DVD,
				PrimitiveDevice.DVD_MULTIDISC,
			].includes(prim)
		) {
			presets[`device_play_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Play`,
				style: {
					text: `${name}\\nPlay`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'play', options: { device: id, fileKey: '' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'device_state',
						options: { device: id, state: 'Play' },
						style: { bgcolor: combineRgb(0, 204, 0), color: combineRgb(0, 0, 0) },
					},
				],
			}

			// -- Pause --
			presets[`device_pause_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Pause`,
				style: {
					text: `${name}\\nPause`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'pause', options: { device: id } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'device_state',
						options: { device: id, state: 'Pause' },
						style: { bgcolor: combineRgb(204, 204, 0), color: combineRgb(0, 0, 0) },
					},
				],
			}
		}

		// -- Stop (all non-CG devices) --
		if (prim !== PrimitiveDevice.CG) {
			presets[`device_stop_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Stop`,
				style: {
					text: `${name}\\nStop`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'stop', options: { device: id } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'device_state',
						options: { device: id, state: 'Stop' },
						style: { bgcolor: combineRgb(51, 51, 51) },
					},
				],
			}
		}

		// -- Record / Record Stop (VIDEO_SERVER, VTR_MULTITAPE, DVD variants, LIVE_STREAM) --
		if (
			[
				PrimitiveDevice.VIDEO_SERVER,
				PrimitiveDevice.VTR_MULTITAPE,
				PrimitiveDevice.DVD_MULTIDISC,
				PrimitiveDevice.DVD,
				PrimitiveDevice.LIVE_STREAM,
			].includes(prim)
		) {
			presets[`device_record_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Record`,
				style: {
					text: `${name}\\nRecord`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'record', options: { device: id, fileKey: '' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'device_state',
						options: { device: id, state: 'Record' },
						style: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
					},
				],
			}

			presets[`device_record_stop_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Record Stop`,
				style: {
					text: `${name}\\nRec Stop`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'record_stop', options: { device: id } }],
						up: [],
					},
				],
				feedbacks: [],
			}
		}

		// -- Passthrough (VIDEO_SERVER with supportsPassthrough) --
		if (prim === PrimitiveDevice.VIDEO_SERVER && device.supportsPassthrough) {
			const partnerChoices = self.getPassthroughDeviceChoices().filter((d) => d.id !== id)
			if (partnerChoices.length > 0) {
				presets[`device_start_passthrough_${id}`] = {
					type: 'button',
					category: `Device: ${name}`,
					name: `${name} Start Passthrough`,
					style: {
						text: `${name}\\nStart PT`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [
								{
									actionId: 'start_passthrough',
									options: { device: id, partnerDevice: partnerChoices[0]?.id ?? 0 },
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'passthrough_active',
							options: { device: id },
							style: { bgcolor: combineRgb(102, 0, 204), color: combineRgb(255, 255, 255) },
						},
					],
				}

				presets[`device_stop_passthrough_${id}`] = {
					type: 'button',
					category: `Device: ${name}`,
					name: `${name} Stop Passthrough`,
					style: {
						text: `${name}\\nStop PT`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [{ actionId: 'stop_passthrough', options: { device: id } }],
							up: [],
						},
					],
					feedbacks: [],
				}
			}
		}

		// -- RTMP Output (VIDEO_SERVER, LIVE_STREAM) --
		if (prim === PrimitiveDevice.VIDEO_SERVER || prim === PrimitiveDevice.LIVE_STREAM) {
			const destinations = self.getNetworkStreamDestinationChoices()
			if (destinations.length > 0) {
				for (const dest of destinations) {
					presets[`device_rtmp_start_${id}_${dest.id}`] = {
						type: 'button',
						category: `Device: ${name}`,
						name: `${name} Start RTMP → ${dest.label}`,
						style: {
							text: `${name}\\nRTMP\\n${dest.label}`,
							size: 'auto',
							color: combineRgb(255, 255, 255),
							bgcolor: combineRgb(0, 0, 0),
						},
						steps: [
							{
								down: [
									{
										actionId: 'start_rtmp_output',
										options: { device: id, destination: dest.id },
									},
								],
								up: [],
							},
						],
						feedbacks: [
							{
								feedbackId: 'rtmp_streaming',
								options: { device: id },
								style: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
							},
						],
					}
				}

				presets[`device_rtmp_stop_all_${id}`] = {
					type: 'button',
					category: `Device: ${name}`,
					name: `${name} Stop All RTMP`,
					style: {
						text: `${name}\\nStop All\\nRTMP`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [{ actionId: 'stop_rtmp_output', options: { device: id, destination: 0 } }],
							up: [],
						},
					],
					feedbacks: [],
				}
			}
		}

		// -- Transcription (VIDEO_SERVER only) --
		if (prim === PrimitiveDevice.VIDEO_SERVER) {
			presets[`device_start_transcribing_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Start Transcribing`,
				style: {
					text: `${name}\\nStart\\nCaption`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'start_transcribing',
								options: { device: id, language: 'en-US', translationLanguage: '' },
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'caption_active',
						options: { device: id },
						style: { bgcolor: combineRgb(0, 102, 204), color: combineRgb(255, 255, 255) },
					},
				],
			}

			presets[`device_stop_transcribing_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Stop Transcribing`,
				style: {
					text: `${name}\\nStop\\nCaption`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'stop_transcribing', options: { device: id } }],
						up: [],
					},
				],
				feedbacks: [],
			}

			// -- Play Stream --
			presets[`device_play_stream_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Play Stream`,
				style: {
					text: `${name}\\nPlay\\nStream`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'play_stream', options: { device: id, streamUrl: '' } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'device_state',
						options: { device: id, state: 'PlayStream' },
						style: { bgcolor: combineRgb(0, 204, 0), color: combineRgb(0, 0, 0) },
					},
				],
			}
		}

		// -- Change Caption Mode (CLOSED_CAPTION only) --
		if (prim === PrimitiveDevice.CLOSED_CAPTION) {
			presets[`device_caption_offline_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Offline Mode`,
				style: {
					text: `${name}\\nOffline`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'change_caption_mode', options: { device: id, mode: 'offline' } }],
						up: [],
					},
				],
				feedbacks: [],
			}

			presets[`device_caption_realtime_${id}`] = {
				type: 'button',
				category: `Device: ${name}`,
				name: `${name} Realtime Mode`,
				style: {
					text: `${name}\\nRealtime`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [{ actionId: 'change_caption_mode', options: { device: id, mode: 'realtime' } }],
						up: [],
					},
				],
				feedbacks: [],
			}
		}

		// -- Switch presets for player devices with outputs --
		if ((devType === DeviceType.DT_PLAYER || devType === DeviceType.DT_BOTH) && prim !== PrimitiveDevice.CG) {
			for (const output of self.outputs) {
				if (!output.active) continue
				presets[`switch_${id}_to_${output.id}`] = {
					type: 'button',
					category: `Switch: ${name}`,
					name: `Switch ${name} → ${output.name}`,
					style: {
						text: `${name}\\n→ ${output.name}`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(0, 0, 0),
					},
					steps: [
						{
							down: [{ actionId: 'switch', options: { device: id, output: output.id } }],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'output_routed_to_device',
							options: { output: output.id, device: id },
							style: { bgcolor: combineRgb(0, 204, 0), color: combineRgb(0, 0, 0) },
						},
					],
				}
			}
		}
	}

	// ── Per-Output Presets ──

	for (const output of self.outputs) {
		if (!output.active) continue

		presets[`output_override_${output.id}`] = {
			type: 'button',
			category: 'Outputs',
			name: `${output.name} Override`,
			style: {
				text: `${output.name}\\nOverride`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'automation_override',
							options: { output: output.id, override: 'true', doLastSwitchOnResume: 'true' },
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'output_override_active',
					options: { output: output.id },
					style: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
				},
			],
		}

		presets[`output_resume_${output.id}`] = {
			type: 'button',
			category: 'Outputs',
			name: `${output.name} Resume`,
			style: {
				text: `${output.name}\\nResume`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'automation_override',
							options: { output: output.id, override: 'false', doLastSwitchOnResume: 'true' },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}

		presets[`output_source_${output.id}`] = {
			type: 'button',
			category: 'Outputs',
			name: `${output.name} Source`,
			style: {
				text: `${output.name}\\n$(cablecast:output_current_device_${output.id})`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'output_override_active',
					options: { output: output.id },
					style: { bgcolor: combineRgb(204, 0, 0), color: combineRgb(255, 255, 255) },
				},
			],
		}
	}

	// ── Event Navigation Presets ──

	presets['event_previous'] = {
		type: 'button',
		category: 'Events',
		name: 'Previous Event',
		style: {
			text: '← Prev\\nEvent',
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [{ actionId: 'previous_event', options: {} }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['event_next'] = {
		type: 'button',
		category: 'Events',
		name: 'Next Event',
		style: {
			text: 'Next →\\nEvent',
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [{ actionId: 'next_event', options: {} }],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['event_info'] = {
		type: 'button',
		category: 'Events',
		name: 'Event Info',
		style: {
			text: '$(cablecast:selected_event_show_title)\\n$(cablecast:selected_event_channel_name)',
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [],
	}

	// ── Macro Presets ──

	for (const macro of self.macros) {
		presets[`macro_${macro.id}`] = {
			type: 'button',
			category: 'Macros',
			name: macro.name,
			style: {
				text: macro.name,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 51, 102),
			},
			steps: [
				{
					down: [{ actionId: 'fire_macro', options: { macroId: macro.id } }],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	// ── Router Health Preset ──

	presets['router_health'] = {
		type: 'button',
		category: 'System',
		name: 'Router Health',
		style: {
			text: 'Router\\n$(cablecast:router_status_level)',
			size: 'auto',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [{ down: [], up: [] }],
		feedbacks: [
			{
				feedbackId: 'router_healthy',
				options: {},
				style: { bgcolor: combineRgb(0, 204, 0), color: combineRgb(0, 0, 0) },
			},
		],
	}

	self.setPresetDefinitions(presets)
}
