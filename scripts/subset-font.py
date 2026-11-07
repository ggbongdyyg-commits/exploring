import sys
from fontTools import subset
from fontTools.ttLib import TTFont

src, out, text = sys.argv[1], sys.argv[2], sys.argv[3]
font = TTFont(src)
cmap = font.getBestCmap()
missing = sorted({c for c in text if ord(c) not in cmap})
print("missing:", missing)

opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = ["*"]
sub = subset.Subsetter(opts)
sub.populate(text=text)
sub.subset(font)
subset.save_font(font, out, opts)
print("saved", out)
