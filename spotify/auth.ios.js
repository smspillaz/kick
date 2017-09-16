import {
  NativeModules
} from 'react-native';

const SpotifyModule = NativeModules.SpotifyModule;

export default function spotifyLogin({
  clientID,
  clientSecret,
  redirectURL,
  requestedScopes
}) {
  return new Promise((resolve, reject) => {
    const options = {
      clientID,
      redirectURL,
      requestedScopes
    };
    SpotifyModule.authenticate(options, (error, data) => {
      if (error) {
        console.error(error);
        reject(error);
      } else {
        resolve({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        });
      }
    });
  });
}