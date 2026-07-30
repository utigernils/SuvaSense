export type MessageHandler = (line: string) => void
export type DisconnectHandler = () => void

export class SerialConnection {
  private port: SerialPort | null = null
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private decoder = new TextDecoder()
  private buffer = ""
  private reading = false

  onMessage: MessageHandler | null = null
  onDisconnect: DisconnectHandler | null = null

  async connect(baudRate = 115200): Promise<void> {
    if (!("serial" in navigator)) {
      throw new Error("Web Serial API not supported in this browser")
    }

    this.port = await navigator.serial.requestPort()
    await this.port.open({ baudRate, dataBits: 8, stopBits: 1, parity: "none" })

    const writable = this.port.writable
    if (!writable) throw new Error("Port has no writable stream")
    this.writer = writable.getWriter()

    const readable = this.port.readable
    if (!readable) throw new Error("Port has no readable stream")

    this.startReading(readable)
  }

  async disconnect(): Promise<void> {
    this.reading = false

    try {
      await this.reader?.cancel()
    } catch {
      // ignore cancel errors
    }

    try {
      this.reader?.releaseLock()
    } catch {
      // ignore
    }

    try {
      this.writer?.releaseLock()
    } catch {
      // ignore
    }

    try {
      await this.port?.close()
    } catch {
      // ignore
    }

    this.port = null
    this.reader = null
    this.writer = null
    this.buffer = ""
  }

  async send(data: string): Promise<void> {
    if (!this.writer) throw new Error("Not connected")
    const encoder = new TextEncoder()
    await this.writer.write(encoder.encode(data + "\n"))
  }

  private async startReading(readable: ReadableStream<Uint8Array>): Promise<void> {
    this.reading = true
    this.reader = readable.getReader()

    try {
      while (this.reading) {
        const { value, done } = await this.reader.read()
        if (done) break

        this.buffer += this.decoder.decode(value, { stream: true })
        this.flushLines()
      }
    } catch {
      // port unplugged or read error
    } finally {
      this.reading = false
      try {
        this.reader?.releaseLock()
      } catch {
        // ignore
      }

      if (this.port) {
        this.onDisconnect?.()
      }
    }
  }

  private flushLines(): void {
    const parts = this.buffer.split("\n")
    this.buffer = parts.pop() ?? ""

    for (const line of parts) {
      const trimmed = line.trim()
      if (trimmed) {
        this.onMessage?.(trimmed)
      }
    }
  }
}
