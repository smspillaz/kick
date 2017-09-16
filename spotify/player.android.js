import Spotify from 'react-native-spotify-sdk';

class Track {
  constructor(uri) {
    this.uri = uri;
  }

  pause() {
    Spotify.pause();
  }

  play() {
    Spotify.playUri(this.uri);
    console.log(`Not implemented, would resume`);
  }

  seek(seconds) {
    console.log(`Not implemented, would seek to ${seconds}`);
  }
}

export default class Player {
  constructor() {
    this.playingTrack = null;
  }

  track(uri, mutator) {
    /* Playing this track, use that */
    if (this.playingTrack && this.playingTrack.uri == uri) {
      mutator(this.playingTrack);
      return;
    }

    /* Update the playing track and try again */
    this.playingTrack = new Track(uri);

    this.track(uri, mutator);
  }
}