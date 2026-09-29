/**
 * Three-dot bounce spinner — a faithful reproduction of the WealthCare/Alegeus
 * `<load-status>` component:
 *
 *   <div class="loading-box"><span class="spinner"><span></span> <span></span> <span></span></span></div>
 *
 * The reference implements it entirely in CSS (keyframes `sk-bouncedelay`); there
 * is no image, GIF, Lottie or sprite behind it, so nothing has to be downloaded.
 * The styles live in app/globals.css under the `wcp-` namespace.
 *
 * Measured against the live reference at 1440px: three #ccc circles ~22px
 * diameter, ~35px apart, horizontally centred in the content column.
 */
export function ThreeDotSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="wcp-loading-box" role="status" aria-live="polite" aria-label={label}>
      <span className="wcp-spinner" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  )
}
