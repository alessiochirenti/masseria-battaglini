# StPageFlip 2.0.7

`page-flip-2.0.7.js` is the locally hosted ES module of StPageFlip 2.0.7.
The original MIT license is unchanged; see the license file in this directory.

## Local render-driver hook

The only modification to the library is in `Render.start()`. Immediately after
`this.update()`, it checks the optional `this.app.guestbookRenderDriver` function.
When present, the function receives the renderer and takes ownership of its clock.
Without the hook, the upstream RAF behavior remains unchanged.

The inserted statement is:

```js
if (typeof this.app.guestbookRenderDriver === 'function') {
  return this.app.guestbookRenderDriver(this)
}
```

`../guestbook-renderer.js` installs this hook through
`attachGuestbookRenderer(flip, stage)` **before** `flip.loadFromHTML(...)`.
It uses the existing GSAP ticker when available and native RAF on demand otherwise.
It detaches while idle, outside the stage's nearby viewport, and while the document
is hidden. Page, orientation, size and pointer changes invalidate a frame, including
instant `turnToPage()` changes used for reduced motion. Hidden animations resume
with their elapsed time preserved. The adapter refreshes `render.timer` before
`startAnimation()` because the library bases animation timing on the last render.

When updating StPageFlip, reapply this single hook and verify its renderer contract
(`render`, `timer`, `animation`, `startAnimation`) and emitted events before release.
