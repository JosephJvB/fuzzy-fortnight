import Track from "./track";

export interface IQuiz {
  ts: string
  questions: IQuestion[]
  responses: IQuizResponse[]
}
export interface IQuestion {
  id: string
  track: Track
  choices: IQuizProfile[]
  answer: IQuizProfile
}
export interface IQuizProfile {
  spotifyId: string
  spotifyDisplayName: string
  spotifyDisplayPicture: string
}
export interface IQuizResponse {
  spotifyId: string
  answers: IQuestion[]
  score: number
}