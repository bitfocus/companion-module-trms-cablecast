import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	username: string
	password: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Cablecast Server',
			width: 8,
			regex: Regex.SOMETHING,
		},
		{
			type: 'textinput',
			id: 'username',
			label: 'Username',
			width: 8,
			regex: Regex.SOMETHING,
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			width: 8,
			regex: Regex.SOMETHING,
		},
		{
			type: 'textinput',
			id: 'locationId',
			label: 'Location ID',
			width: 8,
			regex: Regex.SOMETHING,
		},
	]
}
