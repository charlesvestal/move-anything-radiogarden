# Third-Party Licenses

## FFmpeg

This module bundles a pre-built FFmpeg binary for ARM64 Linux.

- **Source:** https://github.com/yt-dlp/FFmpeg-Builds
- **License:** GNU General Public License v3.0 (GPL-3.0)
- **Website:** https://ffmpeg.org/

FFmpeg is used as a separate executable to decode radio streams into PCM audio.
The module's own source code (MIT) invokes FFmpeg via `fork()/exec()` as an
external process and does not link against FFmpeg libraries.

A copy of the FFmpeg license is included in the distributed module as
`FFMPEG_LICENSE.txt`.

## Radio Garden API

Radio station data is fetched from the [Radio Garden](https://radio.garden) API
at runtime. Radio Garden is a project by Jonathan Puckey / Studio Puckey,
supported by the Netherlands Institute for Sound and Vision.
