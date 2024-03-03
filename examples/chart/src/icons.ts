import { library, dom } from "@fortawesome/fontawesome-svg-core"
import { faAndroid, faApple, faBluetooth, faGithub } from "@fortawesome/free-brands-svg-icons"
import { faCopyright } from "@fortawesome/free-regular-svg-icons"
import {
  faBook,
  faDownload,
  faGamepad,
  faGlobe,
  faScaleBalanced,
  faStop,
  faPlay,
} from "@fortawesome/free-solid-svg-icons"
/**
 * Call dom.i2svg() to replace i tags with svg
 */
export function convertFontAwesome() {
  dom.i2svg()
}
/**
 * Init icons and convert <i> to <svg>
 */
export function setupFontAwesome() {
  library.add(
    faAndroid,
    faApple,
    faBluetooth,
    faBook,
    faCopyright,
    faDownload,
    faGamepad,
    faGithub,
    faGlobe,
    faScaleBalanced,
    faStop,
    faPlay,
  )

  convertFontAwesome()
}
