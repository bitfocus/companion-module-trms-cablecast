import type { ModuleInstance } from './main.js'
import { SetEventVariables } from './variables.js'

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

				if (selectedEvent && selectedEvent.scheduleId !== -1) {
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
		next_event: {
			name: 'Next Event',
			options: [],
			callback: async () => {
				self.log('info', `Next Event action triggered:  ${self.upcomingEvents.length}`)

				if (self.upcomingEvents.length === 0) {
					self.log('warn', 'No upcoming events found')
					return
				}

				const selectedEventId = self.getVariableValue('selected_event_id')
				const selectedEventIndex = self.upcomingEvents.findIndex((event) => {
					return event.scheduleId.toString() === selectedEventId?.toString()
				})

				let nextEvent
				if (selectedEventIndex === undefined) {
					self.log('warn', `Selected event with ID ${selectedEventId} not found in upcoming events`)
					nextEvent = self.upcomingEvents[0]
				} else {
					self.log('info', `Selected event index: ${selectedEventIndex}`)
					nextEvent = self.upcomingEvents[selectedEventIndex + 1] || self.upcomingEvents[0]
				}

				self.setVariableValues({
					selected_event_id: nextEvent.scheduleId.toString(),
				})

				SetEventVariables(self)

				self.log('info', `Next event set to ${nextEvent.showTitle} - ${selectedEventIndex}`)
			},
		},
		previous_event: {
			name: 'Previous Event',
			options: [],
			callback: async () => {
				self.log('info', 'Previous Event action triggered')

				if (self.upcomingEvents.length === 0) {
					self.log('warn', 'No upcoming events found')
					return
				}

				const selectedEventId = self.getVariableValue('selected_event_id')
				const selectedEventIndex = self.upcomingEvents.findIndex(
					(event) => event.scheduleId.toString() === selectedEventId?.toString(),
				)

				const prevIndex =
					selectedEventIndex === -1
						? 0
						: (selectedEventIndex - 1 + self.upcomingEvents.length) % self.upcomingEvents.length

				const previousEvent = self.upcomingEvents[prevIndex]

				self.setVariableValues({
					selected_event_id: previousEvent.scheduleId.toString(),
				})

				SetEventVariables(self)

				self.log('info', `Previous event set to ${previousEvent.showTitle}`)
			},
		},
	})
}
