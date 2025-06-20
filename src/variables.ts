import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export async function UpdateVariables(self: ModuleInstance): Promise<void> {
	const variableDefinitions: CompanionVariableDefinition[] = []
	const variableValues: CompanionVariableValues = {}

	for (const device of self.devices) {
		variableDefinitions.push({
			name: `Device State: ${device.name}`,
			variableId: `device_state_${device.id}`,
		})

		variableDefinitions.push(
			{
				name: `Device Position: ${device.name}`,
				variableId: `device_position_${device.id}`,
			},
			{
				name: `Device Position Hours: ${device.name}`,
				variableId: `device_position_hours_${device.id}`,
			},
			{
				name: `Device Position Minutes: ${device.name}`,
				variableId: `device_position_minutes_${device.id}`,
			},
			{
				name: `Device Position Seconds: ${device.name}`,
				variableId: `device_position_seconds_${device.id}`,
			},
		)

		variableDefinitions.push({
			name: `File Key: ${device.name}`,
			variableId: `device_filekey_${device.id}`,
		})

		variableDefinitions.push({
			name: `Transcribe Active: ${device.name}`,
			variableId: `device_transcribe_active_${device.id}`,
		})
	}

	const automationStatus = await getAutomationStatus.call(self)
	// self.log('info', `AutomationStatus DeviceStatus - ${JSON.stringify(automationStatus.deviceStatus)}`)
	for (const deviceStatus of automationStatus.deviceStatus) {
		const device = self.devices.find((d) => d.id === deviceStatus.id)
		if (device) {
			variableValues[`device_state_${device.id}`] = deviceStatus.action
			// Technically this is the postion in seconds for a playing file. The frameRate will be set to 1
			const positionInFrames = deviceStatus.positionInFrames
			let hours = 'None',
				minutes = 'None',
				seconds = 'None'
			if (typeof positionInFrames === 'number' && deviceStatus.frameRate) {
				const totalSeconds = Math.floor(positionInFrames / deviceStatus.frameRate)
				hours = Math.floor(totalSeconds / 3600)
					.toString()
					.padStart(2, '0')
				minutes = Math.floor((totalSeconds % 3600) / 60)
					.toString()
					.padStart(2, '0')
				seconds = (totalSeconds % 60).toString().padStart(2, '0')
			}
			variableValues[`device_position_${device.id}`] = positionInFrames ?? 'None'
			variableValues[`device_position_hours_${device.id}`] = hours
			variableValues[`device_position_minutes_${device.id}`] = minutes
			variableValues[`device_position_seconds_${device.id}`] = seconds
			variableValues[`device_filekey_${device.id}`] = deviceStatus.fileName || 'None'
			variableValues[`device_transcribe_active_${device.id}`] = deviceStatus.transcribeActive
			self.log('info', `Device: ${device.name}:`)
			self.log('info', `       State: ${deviceStatus.action}`)
			self.log('info', `       Position: ${deviceStatus.positionInFrames || 'None'}`)
			self.log('info', `       FileKey: ${deviceStatus.fileName || 'None'}`)
			self.log('info', `       Transcribe Active: ${deviceStatus.transcribeActive}`)
		} else {
			self.log('warn', `Device with ID ${deviceStatus.id} not found in devices list`)
		}
	}

	self.setVariableDefinitions(variableDefinitions)
	self.setVariableValues(variableValues)
}

export async function getAutomationStatus(this: ModuleInstance): Promise<any> {
	try {
		this.log('info', `Callng Automation Status URL: ${this.config.host}/cablecastapi/v1/automationstatus/?location=1`)
		const response = await fetch(`${this.config.host}/cablecastapi/v1/automationstatus/?location=1`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
			},
		})
		if (!response.ok) {
			throw new Error(`Failed to fetch automationstatus: ${response.statusText}`)
		}

		// this.log('info', `AutomationStatus - ${JSON.stringify(automationStatus)}`)
		return await response.json()
	} catch (error) {
		console.error(`Error to fetching automationstatus:`, error)
		throw error
	}
}
