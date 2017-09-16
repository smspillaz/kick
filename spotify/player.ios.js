import Spotify from 'react-native-spotify-sdk';

class Track extends Object {
  constructor(uri) {
    super();
    this.uri = uri;
  }

  pause() {
    console.log(`Not implemented, would pause`);
  }

  play() {
    console.log(`Not implemented, would resume`);
  }

  seek(seconds) {
    console.log(`Not implemented, would seek to ${seconds}`);
  }
}

export default class Player extends Object {
  constructor() {
    super();
    this.playingTrack = null;
  }

  track(uri) {
    this.playingTrack = new Track(uri);
  }

  withPlayingTrack(mutator) {
    if (this.playingTrack) {
      mutator(this.playingTrack);
    }
  }
}