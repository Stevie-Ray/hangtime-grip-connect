import type { Action } from "../../types.js"

export function buildReturnSettingsAction(): Action {
  return {
    name: "Return",
    description: "Go back to main menu",
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- Return is a no-op, resumes action loop
    run: async () => {},
  }
}
