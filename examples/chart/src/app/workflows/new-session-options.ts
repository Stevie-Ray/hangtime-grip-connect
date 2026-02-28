function toggleOptionGroup(group: HTMLElement, input: HTMLInputElement | HTMLSelectElement, enabled: boolean): void {
  group.toggleAttribute("hidden", !enabled)
  group.classList.toggle("is-disabled", !enabled)
  input.disabled = !enabled
}

export function syncNewSessionOptionVisibility(appElement: HTMLDivElement): void {
  const form = appElement.querySelector<HTMLElement>("#session-options-form")
  if (!form) return

  const includeTorque = form.querySelector<HTMLInputElement>("[data-option=includeTorque]")?.checked
  const torqueGroup = form.querySelector<HTMLElement>("[data-option-group=torque]")
  const torqueInput = form.querySelector<HTMLInputElement>("[data-option=momentArmCm]")
  if (torqueGroup && torqueInput && includeTorque != null) {
    toggleOptionGroup(torqueGroup, torqueInput, includeTorque)
  }

  const includeBodyWeight = form.querySelector<HTMLInputElement>("[data-option=includeBodyWeight]")?.checked
  const bodyWeightGroup = form.querySelector<HTMLElement>("[data-option-group=body-weight]")
  const bodyWeightInput = form.querySelector<HTMLInputElement>("[data-option=bodyWeight]")
  if (bodyWeightGroup && bodyWeightInput && includeBodyWeight != null) {
    toggleOptionGroup(bodyWeightGroup, bodyWeightInput, includeBodyWeight)
  }

  const levelsEnabled = form.querySelector<HTMLInputElement>("[data-option=levelsEnabled]")?.checked
  const targetLevelGroups = form.querySelectorAll<HTMLElement>("[data-option-group=target-levels]")
  targetLevelGroups.forEach((group) => {
    const input = group.querySelector<HTMLInputElement | HTMLSelectElement>("input, select")
    if (levelsEnabled == null || !input) return
    toggleOptionGroup(group, input, levelsEnabled)
  })

  const modeValue = form.querySelector<HTMLSelectElement>("[data-option=mode]")?.value
  const leftRightToggle = form.querySelector<HTMLInputElement>("[data-option=leftRightEnabled]")?.checked
  const leftRightEnabled = leftRightToggle ?? modeValue === "bilateral"
  const leftRightGroups = form.querySelectorAll<HTMLElement>("[data-option-group=left-right]")
  leftRightGroups.forEach((group) => {
    const input = group.querySelector<HTMLInputElement | HTMLSelectElement>("input, select")
    if (!input) return
    toggleOptionGroup(group, input, leftRightEnabled)
  })
}
