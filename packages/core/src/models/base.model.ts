import type { IBase } from "../interfaces/base.interface.js"

export abstract class BaseModel {
  id?: string

  createdAt?: Date

  updatedAt?: Date

  constructor(base: IBase) {
    this.id = base.id ?? globalThis.crypto?.randomUUID()

    this.createdAt = base.createdAt
    this.updatedAt = base.updatedAt
  }
}
