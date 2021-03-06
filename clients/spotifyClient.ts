import axios, { AxiosRequestHeaders, AxiosResponse } from 'axios'
import {
  ISpotifyMeResponse,
  ISpotifyRefreshResponse,
  ISpotifyTopArtistsResponse,
  SpotifyTopRange,
  ISpotifyTopTracksResponse,
  SpotifyItemType,
  ISpotifyTrack,
  ISpotifyArtist
} from '../models/spotifyApi'
import { ISpotifyJson } from '../models/ddb'

export default class SpotifyClient {
  headers: AxiosRequestHeaders
  constructor() {
    const auth = Buffer
      .from(`${process.env.SpotifyClientId}:${process.env.SpotifyClientSecret}`)
      .toString('base64')
    this.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`
    }
  }

  async submitCode(spotifyCode: string) {
    console.log('SpotifyClient.submitCode:', spotifyCode)
    const r = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        code: spotifyCode,
        grant_type: 'authorization_code',
        redirect_uri: process.env.SpotifyRedirectUri
      },
      headers: this.headers
    })
    return r.data
  }
  
  async getProfile(spotifyJson: ISpotifyJson): Promise<ISpotifyMeResponse> {
    await this.validateToken(spotifyJson)
    console.log('SpotifyClient.getProfile')
    const r: AxiosResponse<ISpotifyMeResponse> = await axios({
      url: 'https://api.spotify.com/v1/me',
      headers: {
        Authorization: 'Bearer ' + spotifyJson.access_token
      }
    })
    return r.data
  }

  async getTopItems(
    spotifyJson: ISpotifyJson,
    itemType: SpotifyItemType,
    range: SpotifyTopRange,
    limit: number): Promise<ISpotifyTrack[] | ISpotifyArtist[]> {
      await this.validateToken(spotifyJson)
      console.log('SpotifyClient.getTopItems:', itemType)
      const r: AxiosResponse<ISpotifyTopArtistsResponse | ISpotifyTopTracksResponse> = await axios({
        url: `https://api.spotify.com/v1/me/top/${itemType}`,
        params: {
          limit: limit || 10,
          offset: 0,
          time_range: range || SpotifyTopRange.shortTerm,
        },
        headers: {
          Authorization: 'Bearer ' + spotifyJson.access_token
        }
      })
      return r.data.items
  }

  // actually, if i refresh token, I need to save it back to spotifyProfile DDB with new timestamp
  // otherwise I have to refresh every time. Bad, but will work.
  private async validateToken(spotifyJson: ISpotifyJson): Promise<ISpotifyJson> {
    if (Date.now() > spotifyJson.ts + (spotifyJson.expires_in * 1000)) {
      spotifyJson.access_token = await this.getRefreshToken(spotifyJson)
    }
    return spotifyJson
  }

  private async getRefreshToken(spotifyJson: ISpotifyJson) {
    console.log('SpotifyClient.getRefreshToken')
    const r: AxiosResponse<ISpotifyRefreshResponse> = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'refresh_token',
        refresh_token: spotifyJson.refresh_token
      },
      headers: this.headers
    })
    return r.data.access_token
  }
}