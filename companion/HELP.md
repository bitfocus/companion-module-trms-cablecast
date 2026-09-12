## Cablecast Companion Module

### Overview

Control Cablecast automation directly from Companion — device transport, video routing, RTMP streaming, passthrough, captions, macros, and real-time status monitoring.

### Setup

- **Cablecast Server** — Full URL of your Cablecast server (e.g. `http://cablecast.local`)
- **Username / Password** — An admin account with access to all control rooms is recommended
- **Location ID** — Found in the URL when logged into the Cablecast main menu
- **Poll Interval** — How often to refresh status (250ms, 500ms, or 1000ms). Lower values give faster feedback updates but increase server load.

### Actions

- **Fire Macro** — Execute a control room macro (optionally associated with the selected event)
- **Next Event / Previous Event** — Navigate through upcoming events
- **Play** — Play a file on a video server, VTR, or DVD device
- **Stop** — Stop a device
- **Pause** — Pause a video server, VTR, or DVD device
- **Record** — Start recording on a video server, VTR, DVD, or live stream device
- **Record Stop** — Stop recording
- **Play Stream** — Play a stream URL on a video server
- **Start Passthrough** — Start passthrough between an encoder and decoder
- **Stop Passthrough** — Stop passthrough on a device
- **Start RTMP Output** — Start streaming to a network stream destination
- **Stop RTMP Output** — Stop a specific or all RTMP outputs on a device
- **Start Transcribing** — Start live captioning with language/translation options
- **Stop Transcribing** — Stop live captioning
- **Change Caption Mode** — Switch a caption device between offline and realtime mode
- **Switch** — Route a source device to an output
- **Automation Override** — Override or resume automation on an output

### Feedbacks

- **Device State** — True when a device is in a specific state (Playing, Stopped, Paused, Recording, etc.)
- **Device Error** — True when a device has an error or warning
- **Passthrough Active** — True when a passthrough-capable device is in passthrough mode
- **Output Override Active** — True when an output has automation overridden
- **Output Routed To Device** — True when a specific device is routed to an output
- **Caption Active** — True when a video server is actively transcribing
- **RTMP Streaming** — True when a device has active RTMP output(s)
- **Encoder Video Present** — True when an encoder has a video signal present
- **Stream Connected** — True when a network stream is connected
- **Router Healthy** — True when the router has no errors

### Variables

Variables are created dynamically based on your Cablecast configuration.

- **Event** — `selected_event_id`, `selected_event_show_title`, `selected_event_channel_name`, `selected_event_start`, `selected_event_end`
- **Per-Device** — State, position (hours/minutes/seconds), file key, status level, error, dropped frames, encoder video present, encoder/decoder resolutions, transcribe active/language, passthrough active/role/partners, RTMP active/count
- **Per-Output** — Current routed device name, override active status
- **Per-Network-Stream** — Connected, streaming, address, detected resolution
- **Router** — `router_status_level`, `router_error`

### Presets

Presets are generated automatically for each device and output in your system:

- **Device presets** — Status display, Play, Pause, Stop, Record, Record Stop, Play Stream, Start/Stop Passthrough, Start/Stop RTMP per destination, Start/Stop Transcribing, Caption Mode (per device type)
- **Switch presets** — One button per source-device/output combination
- **Output presets** — Override, Resume, and Source display per output
- **Event presets** — Previous, Next, and Event Info display
- **Macro presets** — One button per configured macro
- **System presets** — Router health status
