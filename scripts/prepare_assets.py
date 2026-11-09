"""
Builds the optimised image layers in public/assets from the original Unsplash
downloads (see ASSETS.md for sources).

Usage:  python scripts/prepare_assets.py <folder-with-original-jpgs>

Expected originals (file names = keys below):
  w3.jpg  window      c5.jpg open sky     j4.jpg jet at dusk
  g1.jpg  charter     k1.jpg cargo        j9.jpg ACMI          g2.jpg hangar
  i2.jpg  interior    c7.jpg global

Requires: pillow, numpy, scipy
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets")
os.makedirs(OUT, exist_ok=True)
meta = {}


def load(name):
    return Image.open(os.path.join(SRC, name + ".jpg")).convert("RGB")


def save(im, name, q=82):
    path = os.path.join(OUT, name + ".webp")
    im.save(path, "WEBP", quality=q, method=6)
    print(f"{name}.webp {im.size} {os.path.getsize(path)//1024} KB")


def diffuse_fill(arr, mask, iterations=400):
    """Fill masked pixels by repeatedly blurring the surroundings into them.
    Works well for soft backgrounds (sky, painted panels)."""
    out = arr.astype(np.float32).copy()
    known = ~mask
    # start from the mean of the known border
    out[mask] = out[known].mean(axis=0)
    for i in range(iterations):
        blurred = ndimage.uniform_filter(out, size=(9, 9, 1))
        out[mask] = blurred[mask]
    return out


def remove_text(im, box, thresh):
    """Soften a tail registration: dark glyphs inside `box` are diffused away."""
    a = np.asarray(im).astype(np.float32)
    x0, y0, x1, y1 = box
    lum = a[..., :3].mean(axis=2)
    m = np.zeros(lum.shape, bool)
    m[y0:y1, x0:x1] = lum[y0:y1, x0:x1] < thresh
    m = ndimage.binary_dilation(m, iterations=5)
    sub = (slice(max(0, y0 - 60), y1 + 60), slice(max(0, x0 - 60), x1 + 60))
    filled = diffuse_fill(a[sub], m[sub], 250)
    a[sub] = filled
    out = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    # very light blur over the patch so it reads as paint, not a smudge
    patch = out.crop((x0 - 10, y0 - 10, x1 + 10, y1 + 10)).filter(ImageFilter.GaussianBlur(2))
    out.paste(patch, (x0 - 10, y0 - 10))
    return out


# ---------------------------------------------------------------- 1. cabin window
def cabin():
    im = load("w3")  # 2560 x 3414 portrait
    W, H = im.size
    S = W / 640.0
    yy, xx = np.mgrid[0:H, 0:W] / S
    cx, cy, a, b, n, shade = 314.5, 390, 154, 231, 2.9, 189
    glass = (np.abs((xx - cx) / a) ** n + np.abs((yy - cy) / b) ** n) <= 1
    glass &= yy > shade + 4 * ((xx - cx) / a) ** 2
    alpha = Image.fromarray(((~glass) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5))

    # Extend the cabin wall sideways so the portrait photo covers a 16:9 screen.
    TH = 2000
    scale = TH / H
    tw = round(W * scale)
    photo = im.resize((tw, TH), Image.LANCZOS)
    alpha = alpha.resize((tw, TH), Image.LANCZOS)
    OW = 3600
    ox = (OW - tw) // 2
    arr = np.asarray(photo).astype(np.float32)
    band = 50
    left = np.median(arr[:, 8:8 + band], axis=1)          # (TH, 3)
    right = np.median(arr[:, -8 - band:-8], axis=1)
    left = ndimage.uniform_filter1d(left, 61, axis=0)
    right = ndimage.uniform_filter1d(right, 61, axis=0)
    canvas = np.zeros((TH, OW, 3), np.float32)
    xs = np.arange(OW)
    for side, col in (("l", left), ("r", right)):
        if side == "l":
            region = xs < ox + 160
            dist = np.clip((ox - xs) / ox, 0, 1)
        else:
            region = xs >= ox + tw - 160
            dist = np.clip((xs - (ox + tw)) / ox, 0, 1)
        shade_f = 1 - 0.38 * dist ** 1.4  # wall curves away from the light
        canvas[:, region] = col[:, None, :] * shade_f[None, region, None]
    rng = np.random.default_rng(7)
    grain = rng.normal(0, 5.5, (TH, OW, 1)).astype(np.float32)
    grain = ndimage.gaussian_filter(grain, (0.7, 0.7, 0))
    canvas += grain
    # feather the photo into the extension
    feather = np.ones(tw, np.float32)
    f = 160
    feather[:f] = np.linspace(0, 1, f)
    feather[-f:] = np.linspace(1, 0, f)
    seg = canvas[:, ox:ox + tw]
    canvas[:, ox:ox + tw] = seg * (1 - feather[None, :, None]) + arr * feather[None, :, None]
    full_alpha = np.full((TH, OW), 255, np.uint8)
    full_alpha[:, ox:ox + tw] = np.asarray(alpha)
    out = Image.fromarray(canvas.clip(0, 255).astype(np.uint8)).convert("RGBA")
    out.putalpha(Image.fromarray(full_alpha))
    save(out, "cabin", 84)
    # window centre / size as fractions of the cabin image (used for the dolly origin)
    gx0 = ox + (cx - a) * S * scale
    gx1 = ox + (cx + a) * S * scale
    gy0 = shade * S * scale
    gy1 = (cy + b) * S * scale
    meta["cabin"] = {
        "w": OW, "h": TH,
        "glass": [gx0 / OW, gy0 / TH, gx1 / OW, gy1 / TH],
    }


def grade_cool(im, amount=1.0):
    """Gradient-map an image into EYARA's cool steel/silver palette so the
    aircraft scene continues the blue open sky instead of jumping to orange."""
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])
    lum = np.clip((lum - 0.08) / 0.84, 0, 1) ** 1.2
    stops = np.array([0.0, 0.35, 0.68, 1.0])
    cols = np.array([[22, 30, 42], [60, 84, 116], [132, 156, 186], [236, 240, 244]], np.float32) / 255.0
    mapped = np.stack([np.interp(lum, stops, cols[:, c]) for c in range(3)], -1)
    out = a * (1 - amount) + mapped * amount
    return Image.fromarray((out.clip(0, 1) * 255).astype(np.uint8))


# ---------------------------------------------------------------- 2. jet + clean plate
def jet():
    im = load("j4")  # 2560 x 2048
    a = np.asarray(im).astype(float)
    r, b = a[..., 0], a[..., 2]
    H, W = r.shape
    s = W / 2156.0
    m = (r - b) < 40
    box = np.zeros_like(m)
    box[int(650 * s):int(1175 * s), int(95 * s):int(2035 * s)] = True
    m &= box
    m = ndimage.binary_opening(m, iterations=1)
    lab, _ = ndimage.label(m)
    m = lab == lab[int(900 * s), int(1180 * s)]
    m = ndimage.binary_closing(m, iterations=3)
    yy, xx = np.mgrid[0:H, 0:W] / s
    wl = np.where(xx < 1180, 1000 + (xx - 100) / 1080 * 75, 1075 - (xx - 1180) / 850 * 85)
    below = yy > wl + 8
    allow = ((xx > 920) & (xx < 1000)) | ((xx > 1240) & (xx < 1320) & (yy < 1163)) | (
        (xx > 1030) & (xx < 1330) & (yy < 1095))
    m &= ~(below & ~allow)
    # under the wings only the dark landing gear belongs to the aircraft
    lum = a.mean(axis=2)
    m &= ~(below & (lum > 75))
    lab, _ = ndimage.label(m)
    m = lab == lab[int(900 * s), int(1180 * s)]
    holes = ndimage.binary_fill_holes(m) & ~m
    hl, hn = ndimage.label(holes)
    sizes = ndimage.sum(holes, hl, range(1, hn + 1))
    for i, sz in enumerate(sizes):
        if sz < 5000:
            m |= hl == (i + 1)

    # clean plate: remove the jet with normalised convolution (background is soft bokeh)
    q = 4
    h4, w4 = H // q, W // q
    small = np.asarray(im.resize((w4, h4), Image.LANCZOS)).astype(np.float32)
    sm = m[: h4 * q, : w4 * q].reshape(h4, q, w4, q).any(axis=(1, 3))
    sm = ndimage.binary_fill_holes(ndimage.binary_closing(sm, iterations=20))
    sm = ndimage.binary_dilation(sm, iterations=12)
    known = (~sm).astype(np.float32)
    est = small.copy()
    for sigma in (40, 20):
        num = ndimage.gaussian_filter(small * known[..., None], (sigma, sigma, 0))
        den = ndimage.gaussian_filter(known, sigma)[..., None] + 1e-6
        nc = num / den
        est[sm] = nc[sm] if sigma == 40 else (0.4 * est[sm] + 0.6 * nc[sm])
    grow = np.asarray(Image.fromarray(sm.astype(np.uint8) * 255).resize((W, H), Image.BILINEAR)) > 127
    filled_img = Image.fromarray(est.clip(0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    filled_img = filled_img.filter(ImageFilter.GaussianBlur(10))
    soft = Image.fromarray(grow.astype(np.uint8) * 255).filter(ImageFilter.GaussianBlur(26))
    plate = Image.composite(filled_img, im, soft)
    rng = np.random.default_rng(3)
    pa = np.asarray(plate).astype(np.float32) + rng.normal(0, 3, (H, W, 1))
    plate = Image.fromarray(pa.clip(0, 255).astype(np.uint8))
    plate = grade_cool(plate, 0.9)
    save(plate.resize((2400, round(2400 * H / W)), Image.LANCZOS), "dusk-plate", 80)

    alpha = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))
    cut = grade_cool(im, 0.45)
    cut.putalpha(alpha)
    ys, xs = np.nonzero(m)
    x0, x1, y0, y1 = xs.min() - 6, xs.max() + 6, ys.min() - 6, ys.max() + 6
    cut = cut.crop((x0, y0, x1, y1))
    save(cut.resize((1800, round(1800 * (y1 - y0) / (x1 - x0))), Image.LANCZOS), "jet", 86)
    meta["jet"] = {"plateW": W, "plateH": H, "box": [x0 / W, y0 / H, x1 / W, y1 / H]}


# ---------------------------------------------------------------- 3. plates
def plates():
    sky = load("c5")
    save(sky.resize((2400, round(2400 * sky.size[1] / sky.size[0])), Image.LANCZOS), "sky-day", 80)

    g1 = load("g1")  # 2560 wide, registration on the tail
    k = g1.size[0] / 1000
    g1 = remove_text(g1, (int(615 * k), int(232 * k), int(695 * k), int(270 * k)), 110)
    save(g1.resize((1800, round(1800 * g1.size[1] / g1.size[0])), Image.LANCZOS), "svc-charter")

    g2 = load("g2")
    k = g2.size[0] / 1000
    # crop below the tail so the registration is out of frame
    g2 = g2.crop((0, int(175 * k), g2.size[0], g2.size[1]))
    save(g2.resize((1800, round(1800 * g2.size[1] / g2.size[0])), Image.LANCZOS), "svc-management")

    for key, name in (("k1", "svc-cargo"), ("j9", "svc-acmi"), ("i2", "svc-concierge")):
        im = load(key)
        im = im.resize((1800, round(1800 * im.size[1] / im.size[0])), Image.LANCZOS)
        if key == "k1":
            im = clean_cargo(im)
        save(im, name)

    # global: horizon over a sea of cloud at blue hour; crop away the rocks at the bottom
    g = load("c7")
    g = g.crop((0, 0, g.size[0], int(g.size[1] * 0.9)))
    save(g.resize((2400, round(2400 * g.size[1] / g.size[0])), Image.LANCZOS), "global", 82)


def clean_cargo(im):
    """Remove the operator's fuselage titles, tail logo and registration (coordinates at 1800px wide)."""
    a = np.asarray(im).astype(np.float32)
    lum = a.mean(axis=2)
    # fuselage titles: fill along the fuselage
    m = np.zeros(lum.shape, bool)
    m[538:582, 1088:1372] = True
    known = (~m).astype(np.float32)
    num = ndimage.gaussian_filter(a * known[..., None], (2, 60, 0))
    den = ndimage.gaussian_filter(known, (2, 60))[..., None] + 1e-6
    a[m] = (num / den)[m]
    # tail logo and registration: fill only the dark aircraft pixels
    for (x0, y0, x1, y1, sig) in [(322, 440, 420, 530, (14, 14)), (520, 548, 610, 578, (2, 40))]:
        lum = a.mean(axis=2)
        m = np.zeros(lum.shape, bool)
        m[y0:y1, x0:x1] = True
        m &= lum < 120
        m = ndimage.binary_dilation(m, iterations=2) & (lum < 140)
        known = (~m & (lum < 120)).astype(np.float32)
        num = ndimage.gaussian_filter(a * known[..., None], (*sig, 0))
        den = ndimage.gaussian_filter(known, sig)[..., None] + 1e-6
        a[m] = (num / den)[m]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


# ---------------------------------------------------------------- 4. cloud sprite for WebGL
def cloud_sprite():
    """A soft cumulus puff built from overlapping gaussian lobes eroded by fbm noise."""
    N = 512
    rng = np.random.default_rng(11)
    yy, xx = np.mgrid[0:N, 0:N] / N
    dens = np.zeros((N, N), np.float32)
    for i in range(18):
        cx = 0.5 + rng.normal(0, 0.14)
        cy = 0.56 + rng.normal(0, 0.06) - abs(cx - 0.5) * 0.1
        r = rng.uniform(0.07, 0.16) * (1.25 - abs(cx - 0.5) * 1.6)
        dens += np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)))
    dens *= np.clip((0.78 - yy) * 7, 0, 1)  # flat-ish base
    noise = np.zeros((N, N), np.float32)
    amp = 1.0
    for octave in range(5):
        res = 6 * 2 ** octave
        base = rng.random((res + 1, res + 1)).astype(np.float32)
        layer = np.asarray(Image.fromarray((base * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)) / 255.0
        noise += amp * layer
        amp *= 0.5
    noise /= noise.max()
    d = np.clip(dens / dens.max(), 0, 1)
    alpha = np.clip((d * (0.55 + 0.6 * noise) - 0.18) * 1.9, 0, 1)
    edge = np.clip(np.minimum.reduce([xx, 1 - xx, yy, 1 - yy]) * 8, 0, 1)
    alpha = ndimage.gaussian_filter(alpha * edge, 2.2)
    lit = 0.80 + 0.20 * np.clip((0.75 - yy) * 2.2, 0, 1)
    rgb = np.stack([lit * 255, lit * 251, lit * 248], -1)
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(OUT, "cloud.png"), optimize=True)
    print("cloud.png")


if __name__ == "__main__":
    cabin()
    jet()
    plates()
    cloud_sprite()
    with open(os.path.join(OUT, "layers.json"), "w") as fh:
        json.dump(meta, fh, indent=2)
    print(json.dumps(meta, indent=2))
