#!/bin/sh
# Copies the site into the sandboxed scratchpad the Browser pane can actually
# read (it cannot read ~/Desktop). Run after editing, then reload the preview.
SRC="/Users/ryanjrny/Desktop/trash-booking"
DEST="/private/tmp/claude-501/-Users-ryanjrny-Desktop-nunjara-connect/58dd4bef-eca5-4a26-a428-1a8e652b3d03/scratchpad/trash-preview"
mkdir -p "$DEST"
cd "$SRC" && tar cf - . | (cd "$DEST" && tar xf -)
echo "synced to $DEST"
