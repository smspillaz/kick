import Spotify from 'react-native-spotify-sdk';
import querystring from 'query-string';
import buffer from 'buffer';

export default function spotifyLogin({
  clientID,
  clientSecret,
  redirectURL,
  requestedScopes
}) {
  return Spotify.setup(clientID,
                       redirectURL,
                       'token',
                       requestedScopes)
  .then((result) => {
    console.log(result);
    return Spotify.launchLogin();
  })
  .then((creds) => {
    const params = {
      code: creds.code,
      redirect_uri: redirectURL,
      grant_type: 'authorization_code'
    };
    const options = {
      method: 'POST',
      body: querystring.stringify(params),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + (new buffer.Buffer(`${clientID}:${clientSecret}`).toString('base64'))
      }
    };

    return fetch('https://accounts.spotify.com/api/token', options)
    .then(body => body.json())
    .then((body) => Spotify.setAccessToken(body.access_token).then(() => ({
      accessToken: body.access_token,
      refreshToken: body.refresh_token
    })));
  });
}