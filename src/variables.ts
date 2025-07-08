import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import type { ModuleInstance } from './main.js'

export async function UpdateVariables(self: ModuleInstance): Promise<void> {
	const variableDefinitions: CompanionVariableDefinition[] = []
	const variableValues: CompanionVariableValues = {}

	variableDefinitions.push(
		{
			name: 'Selected Event ID',
			variableId: 'selected_event_id',
		},
		{
			name: 'Selected Event Show Title',
			variableId: 'selected_event_show_title',
		},
		{
			name: 'Selected Event Channel Name',
			variableId: 'selected_event_channel_name',
		},
		{
			name: 'Selected Event Start',
			variableId: 'selected_event_start',
		},
		{
			name: 'Selected Event End',
			variableId: 'selected_event_end',
		},
	)

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

	SetEventVariables(self)

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
		this.log(
			'info',
			`Callng Automation Status URL: ${this.config.host}/cablecastapi/v1/automationstatus/?location=${this.config.locationId}`,
		)
		const response = await fetch(
			`${this.config.host}/cablecastapi/v1/automationstatus/?location=${this.config.locationId}`,
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
				},
			},
		)
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
		// Select first event if no specific event is selected
		self.log('warn', `Selected event with ID ${selectedEventId} not found in upcoming events`)
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

function FormatDateTimeString(inputDateString?: string) {
	if (!inputDateString) {
		return undefined
	}

	const dateObject = new Date(inputDateString)

	return `${GetMonthAbbreviation(
		dateObject.getMonth(),
	)} ${dateObject.getDate()}, ${dateObject.getFullYear()} ${FormatTime(dateObject.getHours(), dateObject.getMinutes())}`
}

function GetMonthAbbreviation(monthIndex: number): string {
	const monthsAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	return monthsAbbreviations[monthIndex]
}

function FormatTime(hours: number, minutes: number): string {
	const ampm = hours >= 12 ? 'PM' : 'AM'
	const formattedHours = hours % 12 === 0 ? 12 : hours % 12
	const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes
	return `${formattedHours}:${formattedMinutes} ${ampm}`
}
