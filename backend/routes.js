const cp = require('child_process')
const readline = require('readline')
const fs = require('fs')
const express = require('express')
const router = express.Router()
const ytdl = require('ytdl-core')
const ffmpeg = require('ffmpeg-static')

router.get('/api', async (req, res) => {
  try {
    const videoId = req.query.videoId
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const videoInfo = await ytdl.getInfo(url)

    res.attachment(`${videoInfo.title}.mkv`)

    const tracker = {
      start: Date.now(),
      audio: { downloaded: 0, total: Infinity },
      video: { downloaded: 0, total: Infinity },
      merged: { frame: 0, speed: '0x', fps: 0 },
    };
    
    // Get audio and video stream going
    const audio = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
      .on('progress', (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
      });
    const video = ytdl(url, { filter: 'videoonly', quality: 'highestvideo' })
      .on('progress', (_, downloaded, total) => {
        tracker.video = { downloaded, total };
      });
    
    // Get the progress bar going
    const progressbar = setInterval(() => {
      readline.cursorTo(process.stdout, 0);
      const toMB = i => (i / 1024 / 1024).toFixed(2);
    
      process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
      process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);
    
      process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
      process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);
    
      process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
      process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);
    
      process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
      readline.moveCursor(process.stdout, 0, -3);
    }, 1000);
    
    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(ffmpeg, [
      // Remove ffmpeg's console spamming
      '-loglevel', '0', '-hide_banner',
      // Redirect/enable progress messages
      '-progress', 'pipe:3',
      // 3 second audio offset
      '-itsoffset', '0.0', '-i', 'pipe:4',
      '-i', 'pipe:5',
      // Rescale the video
      '-vf', 'scale=1920:1080',
      // Increase processing speed
      '-preset', 'ultrafast',
      // Define framerate
      '-r', '30',
      // Choose some fancy codecs
      '-c:v', 'libx265', '-x265-params', 'log-level=0',
      '-c:a', 'flac',
      // Define output container
      '-f', 'matroska', 'pipe:6',
    ], {
      windowsHide: true,
      stdio: [
        /* Standard: stdin, stdout, stderr */
        'inherit', 'inherit', 'inherit',
        /* Custom: pipe:3, pipe:4, pipe:5, pipe:6 */
        'pipe', 'pipe', 'pipe', 'pipe',
      ],
    });
    ffmpegProcess.on('close', () => {
      process.stdout.write('\n\n\n\n');
      clearInterval(progressbar);
      console.log('done');
    });
    
    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    ffmpegProcess.stdio[3].on('data', chunk => {
      // Parse the param=value list returned by ffmpeg
      const lines = chunk.toString().trim().split('\n');
      const args = {};
      for (const l of lines) {
        const [key, value] = l.trim().split('=');
        args[key] = value;
      }
      tracker.merged = args;
    });
    audio.pipe(ffmpegProcess.stdio[4]);
    video.pipe(ffmpegProcess.stdio[5]);

    process.on('uncaughtException', err => {
      console.error(err.stack);
      console.log("Node NOT Exiting...");
    });

    return ffmpegProcess.stdio[6].pipe(res);
  } 
  catch (err) {
    return res.status(400).send(err)
  }
})

module.exports = router