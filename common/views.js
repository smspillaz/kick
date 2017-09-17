/**
 * Kick -  A React Native App that uses spotify for better running.
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Slider,
  Text,
  TouchableHighlight,
  View,
  FlatList,
  Image
} from 'react-native';
import {
  List,
  ListItem
} from 'react-native-elements';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StackNavigator } from 'react-navigation';

import _groupBy from 'underscore-es/groupBy';
import _values from 'underscore-es/values';
import _compose from 'underscore-es/compose';
import _flatten from 'underscore-es/flatten';
import _map from 'underscore-es/map';

import moment from 'moment';
import querystring from 'query-string';

import spotifyLogin from '../spotify/auth';
import Player from '../spotify/player';

const API_ID = '';
const API_SECRET = ''; // replace
const REDIRECT_URI = 'intensekick://spotify-auth';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome_back_banner: {
    height: 50
  },
  songs_content: {
    flex: 2
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 250,
    height: 45,
    borderRadius: 64
  },
});

class Kick extends Component {
  static navigationOptions = {
    title: 'Welcome'
  };
  onLoginButtonPress = () => {
    spotifyLogin({
      clientID: API_ID,
      clientSecret: API_SECRET,
      redirectURL: REDIRECT_URI,
      requestedScopes: ['streaming', 'user-library-read']
    }).then(({ accessToken, refreshToken }) => {
      this.props.navigation.navigate('Songs', {
        accessToken,
        refreshToken
      });
    }).catch(e => console.error(e));
  }
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to Intense Kick
        </Text>
        <TouchableHighlight
          onPress={this.onLoginButtonPress}
          style={styles.button}
        >
          <Text>
            Get started
          </Text>
        </TouchableHighlight>
      </View>
    );
  }
}

function spotifyAPICall(accessToken, method, params) {
  const encoded = params ? `?${querystring.stringify(params)}` : '';
  return fetch(`https://api.spotify.com/v1/${method}${encoded}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }).then(body => body.json());
}

function depaginateSpotifyAPICall(accessToken, method, params, key, offset = 0, items = []) {
  params.offset = offset;
  params.limit = 50;

  return spotifyAPICall(accessToken, method, params)
  .then((body) => {
    if (body.next) {
      return depaginateSpotifyAPICall(accessToken,
                                      method,
                                      params,
                                      key,
                                      offset + 50,
                                        items.concat(body[key]));
    }

    return items.concat(body[key]);
  });
}

const hardcodedKicks = {
  '6Ggtd1UBsm8GzMdDeEZOvO': {
    kicks: [
      { in: 224, out: 255 },
      { in: 293, out: 327 },
      { in: 342, out: 390 }
    ]
  },
  '2WLVxCr66idKK20Dn9bjzU': {
    kicks: [
      { in: 22, out: 51 },
      { in: 140, out: 183 }
    ]
  },
  '0BEJOtuqIeyAreNKplE8Re': {
    kicks: [
      { in: 46, out: 75 },
      { in: 97, out: 113 },
      { in: 157, out: 185 }
    ]
  },
  '05cdjCnJMHRqmZGC6E5pl1': {
    kicks: [
      { in: 50, out: 97 },
      { in: 162, out: 205 },
      { in: 220, out: 242 },
      { in: 331, out: 375 }
    ]
  },
  '2g09JJaUWkefKTDjqCqukJ': {
    kicks: [
      { in: 72, out: 103 },
      { in: 152, out: 183 }
    ]
  },
  '6WBJXrjpwGHSDk6rnbtULY': {
    kicks: [
      { in: 30, out: 60 },
      { in: 70, out: 85 },
      { in: 167, out: 212 }
    ]
  },
  '7MmG8p0F9N3C4AXdK6o6Eb': {
    kicks: [
      { in: 69, out: 84 },
      { in: 144, out: 180 },
      { in: 193, out: 223 }
    ]
  },
  '70czmnAcu0CqMzqvkUHOIm': {
    kicks: [
      { in: 56, out: 87 },
      { in: 138, out: 180 }
    ]
  },
  '5xL84TYVoMCJZc3ZIv50x4': {
    kicks: [
      { in: 31, out: 77 },
      { in: 130, out: 190 }
    ]
  },
  '4X9xPasgQXYHFj8w6ostXV': {
    kicks: [
      { in: 61, out: 91 },
      { in: 183, out: 221 }
    ]
  },
  '0E3KzwCg0gRXUPVNAnWBXr': {
    kicks: [
      { in: 75, out: 105 },
      { in: 150, out: 180 }
    ]
  },
  '6Uui5N4PGEWkVdiVY26pqU': {
    kicks: [
      { in: 78, out: 84 },
      { in: 116, out: 148 }
    ]
  }
}

const _flatMap = _compose(_flatten, _map);

function partition(items, size) {
  return _values(_groupBy(items, (item, i) => Math.floor(i / size)));
}

function restPeriodsFromKicks(kicks, duration) {
  const periods = [];

  if (kicks.length) {
    periods.push({ in: 0, out: kicks[0].in });
  }

  for (let i = 0; i < kicks.length; ++i) {
    if (i != kicks.length - 1) {
      periods.push({ in: kicks[i].out, out: kicks[i + 1].in });
    }
  }

  if (kicks.length) {
    periods.push({ in: kicks[kicks.length - 1].out, out: duration });
  }

  return periods;
}

function classifyTracksInList(accessToken, ids) {
  const classified = {};

  return Promise.all(partition(ids, 50).map((slice) =>
    depaginateSpotifyAPICall(accessToken, 'audio-features', {
      ids: slice.join(',')
    }, 'audio_features')
  ))
  .then(_flatMap)
  .then((tracks) => {
    tracks.forEach((track) => {
      classified[track.id] = {
        id: track.id,
        ...hardcodedKicks[track.id],
        restPeriods: restPeriodsFromKicks(hardcodedKicks[track.id].kicks,
                                          track.duration_ms / 1000),
        danceability: track.danceability,
        energy: track.energy,
        liveness: track.liveness,
        valence: track.valence,
        tempo: track.tempo,
        duration_ms: track.duration_ms,
        time_signature: track.time_signature
      };
    });
  })
  .then(() => Promise.all(partition(ids, 50).map((slice) => 
    depaginateSpotifyAPICall(accessToken, 'tracks', {
      ids: slice.join(',')
    }, 'tracks')
  )))
  .then(_flatMap)
  .then((tracks) => {
    tracks.forEach((item) => {
      classified[item.id] = {
        ...classified[item.id],
        name: item.name,
        artists: item.artists.map(artist => artist.name),
        image: item.album.images.reduce((image, incoming) => {
          if (!image.url || incoming.width < image.width) {
            return incoming;
          }

          return image;
        }, {
            height: 0,
            width: 0,
            url: null
        })
      }
    });
  })
  .then(() => classified);
}

function arrangeByKicks({
  classifiedTracks,
  minKickDuration,
  maxRestDuration,
  minEnergy,
  minValence,
  minTempo,
}) {
  let qualifiyingTrackIds = Object.keys(classifiedTracks).filter((trackKey) => {
    const track = classifiedTracks[trackKey];
    if (track.energy < minEnergy) {
      return false;
    }

    if (track.valence < minValence) {
      return false;
    }

    if (track.tempo < minTempo) {
      return false;
    }

    /* Examine all the kicks and make sure that there is
     * at least one which is longer than minKickDuration */
    if (!track.kicks.map(k => k.out - k.in).filter(d => d >= minKickDuration).length) {
      return false;
    }

    /* Examine all rest periods and make sure that no rest
     * period violates the maxRestDuration constraint */
    if (track.restPeriods.map(r => r.out - r.in).filter(d => d > maxRestDuration).length) {
      return false;
    }

    return true;
  });

  /* Greedy appraoch. Take the first one that would
   * minimize the amount of rest time. The result
   * is that we'll eventually get lots of rest time
   * at the end, which is probably what we want anyway. */
  let arrangedTrackIds = [];
  while (qualifiyingTrackIds.length > 0) {
    const lastRestPeriods = arrangedTrackIds.length ? arrangedTrackIds[arrangedTrackIds.length - 1].restPeriods : null;
    const lastRestPeriod = lastRestPeriods ? lastRestPeriods[lastRestPeriods - 1] : null;
    const lastRestTime = lastRestPeriod ? lastRestPeriod.out - lastRestPeriod.in : 0;

    let bestRestTime = Number.MAX_VALUE;
    let bestTrackIdIndex = -1;

    for (let i = 0; i < qualifiyingTrackIds.length; ++i) {
      const candidateTrack = classifiedTracks[qualifiyingTrackIds[i]];
      const beginRestTime = candidateTrack.restPeriods[0].out;

      if (lastRestTime + beginRestTime < bestRestTime) {
        bestRestTime = lastRestTime + beginRestTime;
        bestTrackIdIndex = i;
      }
    }

    arrangedTrackIds.push(qualifiyingTrackIds[bestTrackIdIndex]);
    qualifiyingTrackIds.splice(bestTrackIdIndex, 1);
  }

  return arrangedTrackIds.map(id => classifiedTracks[id]);
}

function computeTotalDurationSeconds(tracks) {
  return tracks.reduce((total, track) => total + track.duration_ms / 1000, 0);
}

function formatTime(seconds) {
  return moment.utc(seconds * 1000).format('HH:mm:ss');
}

function formatTrackFromId(id) {
  return `spotify:track:${id}`;
}

class Playbar extends Component {
  render() {
    return (
      <View style={{ flexDirection: 'row' }} >
        <MaterialIcons.Button
          mdPlay
          onPress={this.props.playPauseButtonPressed}
          style={{ height: 64, width: 64 }}
          backgroundColor="#ffffff"
        />
        <Slider
          minimumValue={0}
          maximumValue={this.props.duration}
          style={{flex: 4}}
          value={this.props.location}
          onSlidingComplete={this.props.seekToPosition}
        />
        <Text>{formatTime(this.props.duration)}</Text>
      </View>
    )
  }
}

function locationToTrack(location, arrangedTracks) {
  const locationMs = location * 1000;

  return arrangedTracks.reduce(({ candidate, total, found }, track) => {
    const offsetWithinTotalAndLocation = locationMs - total;
    return (
      !found &&
      offsetWithinTotalAndLocation >= 0 &&
      offsetWithinTotalAndLocation < track.duration_ms
    ) ? {
      candidate: track,
      total: total + track.duration_ms,
      found: true
    } : { candidate, total: total + track.duration_ms, found }
  }, { candidate: arrangedTracks[0], total: 0, found: false }).candidate;
}

function trackToLocation(uri, arrangedTracks) {
  let locationMs = 0;

  for (let track of arrangedTracks) {
    if (track.id === uri)
      break;
    else
      locationMs += track.duration_ms;
  }

  return locationMs / 1000;
}

class Playback extends Component {
  constructor(props) {
    super(props);
    this.player = null;
    this.state = {
      playing: false,
      location: 0
    };
  }

  componentDidMount() {
    this.player = new Player();
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.playing !== this.state.playing) {
      const currentlyPlayingTrack = locationToTrack(this.state.location, this.props.arrangedTracks);
      this.player.track(formatTrackFromId(currentlyPlayingTrack.id)).then(track =>
        nextState.playing ? track.play() : track.pause()
      );
    }

    if (nextState.location !== this.state.location) {
      /* Make the current track active and seek */
      const nextTrack = locationToTrack(nextState.location, this.props.arrangedTracks);
      const nextTrackLocation = trackToLocation(nextTrack.id, this.props.arrangedTracks);
      const locationWithinTrack = nextState.location - nextTrackLocation;
      this.player.track(formatTrackFromId(nextTrack.id)).then(track =>
        track.seek(locationWithinTrack * 1000).then(() =>
          nextState.playing ? track.play() : track.pause()
        )
      );
    }
  }

  playPauseButtonPressed() {
    if (!this.player)
      return;

    this.setState({
      playing: !this.state.playing
    });    
  }

  goToSong(uri) {
    this.setState({
      location: trackToLocation(uri, this.props.arrangedTracks)
    });
  }

  seekToPosition(pos) {
    this.setState({
      location: pos
    });
  }

  render() {
    return (
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {this.props.render({
          playing: this.state.playing,
          location: this.state.location,
          goToSong: uri => this.goToSong(uri),
          seekToPosition: pos => this.seekToPosition(pos),
          toggle: () => this.playPauseButtonPressed()
        })}
      </View>
    );
  }
}

class SongList extends Component {
  render() {
    const itemRenderer = ({ item }) => {
      return (
        <ListItem
          avatar={
            <Image
              source={{ uri: item.image.url }}
              style={{ width: 64, height: 64 }}
            />
          }
          containerStyle={{
            paddingLeft: 0,
            paddingTop: 0,
            paddingRight: 0,
            paddingBottom: 0,
            height: 64,
            marginLeft: -10
          }}
          titleContainerStyle={{ marginLeft: 24 }}
          subtitleContainerStyle={{ marginLeft: 24 }}
          title={item.name}
          subtitle={item.artists.join(' ')}
          onPress={() => this.props.songPressed(item.id)}
          hideChevron
        />
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <List style={{ flex: 1 }} conatinerStyle={{ marginLeft: 0 }}>
          <FlatList
            data={this.props.arrangedTracks}
            renderItem={itemRenderer}
            keyExtractor={item => item.id}
          />
        </List>
      </View>
    );
  }
}

class Songs extends Component {
  static navigationOptions = {
    title: 'Your Music',
    tracks: []
  };

  constructor(props) {
    super(props);
    this.state = {
      welcome_text: 'Fetching your details...',
      classifiedTracks: {}
    };

    this.player = null;
    this.arrangedTracks = [];
    this.playbackLocation = 0;
  }

  componentDidMount() {
    const token = this.props.navigation.state.params.accessToken;

    spotifyAPICall(token, 'me').then(body => this.setState({
      welcome_text: `Welcome back, ${body.id}`
    }));

    classifyTracksInList(token, Object.keys(hardcodedKicks)).then(classified =>
      this.setState({
        classifiedTracks: classified
      })
    ).catch(e => console.error(e));
  }

  componentWillUpdate(nextProps, nextState) {
    /* We store arrangedTracks here so that we don't have to recompute
     * it every time the component re-renders or we touch the play or
     * pause buttons */
    this.arrangedTracks = arrangeByKicks({
      classifiedTracks: nextState.classifiedTracks,
      minValence: 0.1,
      minEnergy: 0.5,
      minTempo: 95,
      minKickDuration: 20,
      maxRestDuration: 300
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.welcome_back_banner}>
          <Text style={styles.welcome}>{this.state.welcome_text}</Text>
        </View>
        <Playback
          arrangedTracks={this.arrangedTracks}
          render={({ playing, location, goToSong, seekToPosition, toggle }) => (
            <View style={{ flex: 1 }}>
              <SongList
                songPressed={goToSong}
                arrangedTracks={this.arrangedTracks}
              />
              <Playbar
                location={location}
                playing={playing}
                seekToPosition={seekToPosition}
                duration={computeTotalDurationSeconds(this.arrangedTracks)}
                playPauseButtonPressed={toggle}
                style={{ flex: 1, flexDirection: 'row' }}
              />
            </View>
        )}/>
      </View>
    );
  }
}

const KickAppNavigator = StackNavigator({
  Welcome: {
    screen: Kick
  },
  Songs: {
    screen: Songs
  }
});

export default KickAppNavigator;

