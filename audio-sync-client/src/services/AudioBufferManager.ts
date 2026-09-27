/**
 * Manages in-memory audio chunk buffering and sequence checking.
 * Prepares raw payloads for future Web Audio API queues.
 */
export class AudioBufferManager {
  private chunks: Map<number, string> = new Map();
  private expectedSequence = 0;
  private missingChunks: Set<number> = new Set();
  private receivedCount = 0;

  /**
   * Adds an incoming audio chunk to the buffer and runs sequence diagnostics.
   * @param sequenceNumber sequence number of the chunk
   * @param base64Data base64 encoded audio byte array
   */
  public addChunk(sequenceNumber: number, base64Data: string): void {
    this.chunks.set(sequenceNumber, base64Data);
    this.receivedCount++;

    if (this.expectedSequence === 0) {
      // First chunk received, initialize starting point
      this.expectedSequence = sequenceNumber;
    }

    if (sequenceNumber > this.expectedSequence) {
      // Gap detected! Mark all intermediate sequence numbers as missing
      for (let seq = this.expectedSequence; seq < sequenceNumber; seq++) {
        this.missingChunks.add(seq);
      }
      this.expectedSequence = sequenceNumber + 1;
    } else if (sequenceNumber === this.expectedSequence) {
      this.expectedSequence++;
    } else {
      // Late chunk arrival: if it fills a marked gap, clear it from missing list
      if (this.missingChunks.has(sequenceNumber)) {
        this.missingChunks.delete(sequenceNumber);
      }
    }
  }

  /**
   * Get count of successfully received chunks
   */
  public getReceivedCount(): number {
    return this.receivedCount;
  }

  /**
   * Get count of missing chunks
   */
  public getMissingCount(): number {
    return this.missingChunks.size;
  }

  /**
   * Get next expected sequence number
   */
  public getExpectedSequence(): number {
    return this.expectedSequence;
  }

  /**
   * Calculate stream health based on received and missing chunk ratios
   * Returns a percentage value between 0 and 100
   */
  public getStreamHealth(): number {
    const totalExpected = this.receivedCount + this.missingChunks.size;
    if (totalExpected === 0) return 100;
    return Math.round((this.receivedCount / totalExpected) * 100);
  }

  /**
   * Retrieve cached chunks map
   */
  public getBufferedChunks(): Map<number, string> {
    return this.chunks;
  }

  /**
   * Reset tracking state
   */
  public clear(): void {
    this.chunks.clear();
    this.expectedSequence = 0;
    this.missingChunks.clear();
    this.receivedCount = 0;
  }
}
