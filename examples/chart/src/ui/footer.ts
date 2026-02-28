export function setupFooter(): string {
  return `
    <footer>
      <small>
        <a href="https://hangtime.stevie-ray.nl/" target="_blank">
          <i class="fa-regular fa-copyright"></i> HangTime:
        </a>
        <a href="https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime" target="_blank">
          <i class="fab fa-android"></i> Android
        </a>
        <a href="https://apps.apple.com/us/app/hangtime-hangboard-training/id1631706818" target="_blank">
          <i class="fab fa-apple"></i> iOS
        </a>
        |
        <a href="https://github.com/Stevie-Ray/hangtime-grip-connect" target="_blank">
          <i class="fab fa-github"></i> Github
        </a>
        |
        <a href="https://stevie-ray.github.io/hangtime-grip-connect/" target="_blank">
          <i class="fa-solid fa-book"></i> Docs
        </a>
        |
        <a href="https://caniuse.com/web-bluetooth" target="_blank">
          <i class="fa-solid fa-globe"></i> Browser Support
        </a>
        |
        <a
          href="https://grip-connect-kilter-board.vercel.app/?route=p1083r15p1117r15p1164r12p1185r12p1233r13p1282r13p1303r13p1372r13p1392r14p1505r15"
          target="_blank"
        >
          <i class="fa-solid fa-chess-board"></i> Kilter Board
        </a>
        |
        <a href="https://grip-connect-flappy-bird.vercel.app/" target="_blank">
          <i class="fa-solid fa-gamepad"></i> Flappy Bird
        </a>
        <span class="footer-cli-line">
          This tool is also available for CLI:
          <code>npx @hangtime/cli</code>
          <button type="button" class="footer-copy-btn" data-copy-cli="npx @hangtime/cli" aria-label="Copy CLI command">
            <i class="fa-solid fa-copy" aria-hidden="true"></i>
          </button>
        </span>
      </small>
    </footer>
  `
}
