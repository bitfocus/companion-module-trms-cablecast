import type { ModuleInstance } from './main.js'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		fire_macro: {
			name: 'Fire Macro',
			options: [
				{
					id: 'macroId',
					type: 'dropdown',
					label: 'Macro',
					default: '',
					choices: self.macros.map((macro) => ({
						id: macro.id,
						label: macro.name,
					})),
				},
			],
			callback: async (event) => {
				self.log('info', `Fire macro ${JSON.stringify(event)}`)

				const macroId = event.options.macroId
				let url = `${self.config.host}/cablecastapi/v1/forceevents/customaction/${macroId}`

				const selectedEventId = self.getVariableValue('selected_event_id')
				const selectedEvent = self.upcomingEvents.find((event) => event.scheduleId.toString() === selectedEventId)

				if (selectedEvent) {
					url += `?eventScheduleId=${selectedEvent.scheduleId}`
				}

				try {
					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Basic ${Buffer.from(`${self.config.username}:${self.config.password}`).toString(
								'base64',
							)}`,
						},
					})

					if (!response.ok) {
						self.log('error', `CustomAction POST failed: ${response.statusText}`)
					} else {
						self.log('info', 'CustomAction POST succeeded')
					}
				} catch (err) {
					self.log('error', `CustomAction POST error: ${err}`)
				}
			},
		},
	})
}
