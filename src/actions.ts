import type { ModuleInstance } from './main.js'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		sample_action: {
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
				const url = `${self.config.host}/cablecastapi/v1/forceevents/customaction/${macroId}`

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
