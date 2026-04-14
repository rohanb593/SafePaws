// Calendar — one per PetMinder, prevents scheduling conflicts (RQ12, RQ20)
//
// Table: calendars
// Columns:
//   id: string (uuid, primary key)
//   user_id: string (uuid, unique FK → profiles.id — the minder’s profile id)
//   available_timing: Json   (TimeSlot[])
//   booked_timing: Json      (TimeSlot[])
//
// RLS: same user can update their row; any authenticated user can read
//
// Exports: Calendar interface, TimeSlot interface, GPSCoordinates interface
export interface TimeSlot {
  day: string
  start: string
  end: string
}

export interface Calendar {
  id: string
  user_id: string
  available_timing: TimeSlot[]
  booked_timing: TimeSlot[]
  updated_at: string
}

export interface GPSCoordinates {
  latitude: number
  longitude: number
  updated_at: string
}