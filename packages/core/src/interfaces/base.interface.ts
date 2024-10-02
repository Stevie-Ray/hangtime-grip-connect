/**
 * Represents the base properties for an entity.
 */
export interface IBase {
  /**
   * Unique identifier for the entity (optional).
   */
  id?: string

  /**
   * The date and time when the entity was created (optional).
   */
  createdAt?: Date

  /**
   * The date and time when the entity was last updated (optional).
   */
  updatedAt?: Date
}
