import Spotify from 'react-native-spotify-sdk';

class Track {
  constructor(uri) {
    this.uri = uri;
  }

  pause() {
    return Spotify.pause();
  }

  play() {
    return Spotify.resume();
  }

  seek(seconds) {
    console.log(`Not implemented, would seek to ${seconds}`);
    return Promise.resolve();
  }

  state() {
    return Spotify.playbackState();
  }

  metadata() {
    return Spotify.playbackMetadata();
  }
}

export default class Player {
  constructor() {
    this.playingTrack = null;
  }

  track(uri) {
    /* Playing this track, use that */
    if (this.playingTrack && this.playingTrack.uri == uri) {
      return Promise.resolve(this.playingTrack);
    }

    /* Update the playing track and try again */
    this.playingTrack = new Track(uri);
    return Spotify.playUri(uri).then(() =>
      /* Immediately pause it and let the player figure out what to do */
      this.playingTrack.pause().then(() => this.track(uri))
    );
  }
}