import { dom, library } from "@fortawesome/fontawesome-svg-core"
import { faAndroid, faApple, faBluetooth, faGithub } from "@fortawesome/free-brands-svg-icons"
import {
  faBook,
  faCopyright,
  faGamepad,
  faGlobe,
  faLinkSlash,
  faScaleBalanced,
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
    faGamepad,
    faGithub,
    faGlobe,
    faLinkSlash,
    faScaleBalanced,
  )

  convertFontAwesome()
}
