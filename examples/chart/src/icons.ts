import { library, dom } from "@fortawesome/fontawesome-svg-core"
import { faAndroid, faApple, faBluetooth, faGithub } from "@fortawesome/free-brands-svg-icons"
import { faCopyright } from "@fortawesome/free-regular-svg-icons"
import {
  faBook,
  faChessBoard,
  faDownload,
  faGamepad,
  faGlobe,
  faLinkSlash,
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
    faChessBoard,
    faDownload,
    faGamepad,
    faGithub,
    faGlobe,
    faLinkSlash,
    faScaleBalanced,
    faStop,
    faPlay,
  )

  convertFontAwesome()
}
