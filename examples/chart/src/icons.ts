import { dom, library } from "@fortawesome/fontawesome-svg-core"
import { faAndroid, faApple, faBluetooth, faGithub } from "@fortawesome/free-brands-svg-icons"
import {
  faArrowLeft,
  faBook,
  faChessBoard,
  faCopy,
  faCopyright,
  faDownload,
  faGamepad,
  faGear,
  faGlobe,
  faLinkSlash,
  faPlay,
  faScaleBalanced,
  faStop,
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
    faArrowLeft,
    faBluetooth,
    faBook,
    faCopy,
    faCopyright,
    faChessBoard,
    faDownload,
    faGamepad,
    faGear,
    faGithub,
    faGlobe,
    faLinkSlash,
    faScaleBalanced,
    faStop,
    faPlay,
  )

  convertFontAwesome()
}
