interface SerialPortInfo {
  readonly usbVendorId?: number
  readonly usbProductId?: number
}

interface SerialPort {
  readonly readable: ReadableStream<Uint8Array> | null
  readonly writable: WritableStream<Uint8Array> | null
  open(options: SerialOptions): Promise<void>
  close(): Promise<void>
  getInfo(): SerialPortInfo
}

interface SerialOptions {
  baudRate: number
  dataBits?: 7 | 8
  stopBits?: 1 | 2
  parity?: "none" | "even" | "odd"
  bufferSize?: number
  flowControl?: "none" | "hardware"
}

interface Serial extends EventTarget {
  onconnect: ((this: this, ev: Event) => void) | null
  ondisconnect: ((this: this, ev: Event) => void) | null
  getPorts(): Promise<SerialPort[]>
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
}

interface SerialPortRequestOptions {
  filters?: SerialPortFilter[]
}

interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

interface Navigator {
  readonly serial: Serial
}
