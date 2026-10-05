# ModRide: F9R telemetry integration

The deployed page is a static viewer. It does not read USB, configure the receiver,
provide a telemetry server, or send vehicle control commands. There is one vehicle:
`modride-01`. Its ant marker appears only after a valid, recent fix arrives.

## Recommended connection

F9R USB/UART → vehicle computer → GNSS/ROS 2 driver → telemetry bridge → authenticated
HTTPS/WSS server → ModRide browser.

If the vehicle already has a ROS 2 driver, reuse its published position instead of
opening the serial port from a second process. Inspect actual topics and message
types with `ros2 topic list -t` and `ros2 topic info <topic> -v`. A NavSatFix topic
contains latitude/longitude, but heading and RTK fixed/float normally need additional
receiver messages. Do not infer RTK fixed from NavSatFix status alone.

For a non-ROS installation, parse UBX-NAV-PVT on the vehicle computer. Receiver
firmware configuration, serial device and baud rate must match the installed board.
Check the interface description for that exact firmware. Raw UBX latitude/longitude
use 1e-7 degrees, heading 1e-5 degrees, hAcc millimetres, gSpeed mm/s. Some parsing
libraries already return scaled values: do not scale twice. Only use headVeh when
headVehValid is set. headMot describes course of motion, not guaranteed vehicle yaw.

RTCM correction delivery to the receiver is separate from position delivery to the
browser. Connecting this UI does not establish RTK or calibrate dead reckoning.

## Browser message contract

Send each JSON object as one WebSocket text frame at approximately 5–10 Hz:

```json
{
  "vehicle_id": "modride-01",
  "timestamp": "2026-10-04T10:00:00.000Z",
  "latitude": 13.6518,
  "longitude": 100.4927,
  "fix_valid": true,
  "fix": "rtk_fixed",
  "h_acc_m": 0.025,
  "heading_deg": 85.2,
  "heading_valid": true,
  "speed_mps": 1.2
}
```

The coordinates above illustrate format only. Replace all values with measurements.
Timestamp must be the measurement's UTC time, not the time an old fix was replayed.
Synchronize receiver/vehicle/browser clocks. The viewer rejects fixes over five
seconds old, more than two seconds in the future, duplicate/out-of-order samples,
invalid coordinates, invalid fixes and other vehicle IDs. The last marker is dimmed
on disconnect/staleness. It does not extrapolate motion. This display threshold is
not a vehicle safety threshold. There is no automatic reconnect yet.

Use fix values `gnss`, `rtk_float`, `rtk_fixed`, or `dead_reckoning` from verified
receiver status. Missing heading is permitted; send `heading_valid: false`.

## Deployment

The published HTTPS page requires a WSS endpoint with a valid certificate. Run the
bridge on the vehicle or backend, not in the static Sites page. A remote backend is
usually reached by an outbound authenticated connection from the vehicle over Wi-Fi
or cellular; the browser subscribes to that backend. A private-network server can
also work if the browser can reach it and its certificate is valid.

Enforce viewer and publisher authentication, check the browser Origin, and restrict
each publisher to its own vehicle. Private access to the website does not secure a
separate telemetry server. Prefer a short-lived session or cookie; do not embed
permanent secrets in JavaScript or in saved URLs. This UI does not implement the
server's login/session issuance flow.

In ModRide, expand “เชื่อมต่อสัญญาณรถ”, enter the WSS URL, and select “เชื่อมต่อ”.
The server must already be running and permit that browser session. Test first with
a recorded feed, then compare a stationary and moving vehicle against the map.

OSM is a background display, not a surveyed driving map. Receiver/antenna position
and vehicle reference point may differ. Confirm antenna lever arm, heading frame,
receiver fusion calibration, and real pickup/drop-off locations before navigation.
