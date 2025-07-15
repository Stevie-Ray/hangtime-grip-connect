import type { IBase } from "../interfaces/base.interface.js"

export abstract class BaseModel {
  id?: string
  createdAt?: Date
  updatedAt?: Date

  constructor(base: IBase) {
    this.id = base.id ?? globalThis.crypto?.randomUUID?.() ?? BaseModel.generateUUID()

    this.createdAt = base.createdAt
    this.updatedAt = base.updatedAt
  }

  /**
   * Generates a UUID using a simple algorithm.
   * @returns A string representing a UUID.
   */
  private static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16)
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }
}
