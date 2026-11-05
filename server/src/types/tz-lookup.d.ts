declare module 'tz-lookup' {
  /** IANA-зона за широтою й довготою */
  export default function tzlookup(lat: number, lon: number): string
}
