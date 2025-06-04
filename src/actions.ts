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
			},
		},
	})
}
