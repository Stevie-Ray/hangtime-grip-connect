import { hasTrainingProgramsEnv } from "./training-programs.js"

export interface MenuAction {
  id: string
  name: string
  short_description: string
  description?: string
  disabled?: boolean
}

const trainingProgramsEnabled = hasTrainingProgramsEnv()

export const menuActions: MenuAction[] = [
  {
    id: "live-data",
    name: "Live Data",
    short_description: "Just the raw data visualised in real-time",
  },
  {
    id: "peak-force-mvc",
    name: "Peak Force / MVC",
    short_description: "Record maximum voluntary contraction (MVC), asymmetrically.",
    description:
      "Use this test to measure the peak force (Maximum Voluntary Contraction (MVC)) of a muscle. Choose Single or Left/Right to record one side or both. You can also enable torque and body weight calculations to get more detailed insights into your strength measurements.",
  },
  {
    id: "endurance",
    name: "Endurance",
    short_description: "Record data for a given duration.",
  },
  {
    id: "rfd",
    name: "RFD",
    short_description: "Record and calculate Rate of Force Development or explosive strength.",
    description:
      "Rate of Force Development (RFD) is a measure of explosive strength or how fast the muscle is developing force. RFD is represented by the slope of the load curve. The recording of an RFD test runs for 5 seconds and aims at capturing one well-performed pull about halfway into the recording cycle. Please make sure that the device is tared before starting the test. For a valid test result you should not have any slack in the system before performing the pull and you should avoid outputting any force before the actual pull starts. By default the 20-80% protocol is used, but you can choose a different mode. In this protocol you can choose to record one side or both. By default the left side is recorded, but you can choose to record the right side instead. You can also choose to pause between sides for a given amount of seconds. This is useful if you want to rest between sides or if you want to record a different side each time. We define RFD as the slope of a linear curve passing 1; the intersection of the load curve and 20% of max load and 2; the intersection of the load curve and 80% of max load. You can also use a Time-interval protocol to calculate RFD. In that case you need to manually set the onset threshold in order to determine the starting point of the time-window and you need to set your desired time-window. RFD time-interval is calculated as the slope of the linear curve passing 1; the intersection of the load curve and the onset threshold and 2; the intersection of the load curve and the t0 + time-window.",
  },
  {
    id: "repeaters",
    name: "Repeaters",
    short_description: "Design a custom workout consisting of sets and repetitions.",
  },
  {
    id: "critical-force",
    name: "Critical Force",
    short_description: "Determine your sustainable maximum force with repeated pulls.",
    description:
      "In this test we use the all-out finger flexor protocol to estimate Critical Force: the highest force you can sustain without progressive fatigue. You perform repeated pull and rest intervals until your output plateaus.",
  },
  {
    id: "training-programs",
    name: "Training Programs",
    short_description: "Get inspired by other users",
    disabled: !trainingProgramsEnabled,
  },
]

export function setupMenu() {
  const actions = menuActions

  return `
  <nav class="action-menu" aria-label="CLI interactive actions">
    <menu class="action-menu-list">
      ${actions
        .map(
          (action) => `
            <li class="card">
              ${
                action.disabled
                  ? `<span class="card-content action-menu-link-disabled" aria-label="${action.name}" aria-disabled="true">`
                  : `<a class="card-content" href="${
                      action.id === "live-data"
                        ? `?route=${action.id}&screen=chart`
                        : action.id === "training-programs"
                          ? "?screen=training-programs"
                          : `?route=${action.id}`
                    }" aria-label="${action.name}">`
              }
                <strong>${action.name}</strong>
                <small>${action.short_description}</small>
              ${action.disabled ? "</span>" : "</a>"}
            </li>
          `,
        )
        .join("")}
    </menu>
  </nav>
  `
}
